import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

const memberSchema = z.object({
  name: z.string().min(1, { message: "Name cannot be empty." }),
  role: z.enum(["backend", "frontend", "UI/UX"], {
    message: "Role must be one of the following: backend, frontend, UI/UX.",
  }),
});

const main = async () => {
  try {
    const members = [
      { name: "John Doe", role: "backend" },
      { name: "Jane Smith", role: "UI/UX" },
      { name: "", role: "backend" }, 
      { name: "Invalid Role User", role: "manager" },
    ];

    const createdMembers = [];
    for (const member of members) {
      const validationResult = memberSchema.safeParse(member);
      if (!validationResult.success) {
        console.error("Validation Error:", validationResult.error.errors);
        continue; // Skip invalid members
      }

      const createdMember = await prisma.member.create({ data: member });
      createdMembers.push(createdMember);
      console.log("Member Added Successfully:", createdMember);
    }

    const projects = [
      {
        name: "Health App",
        description: "A project for tracking health metrics.",
      },
      {
        name: "E-commerce Platform",
        description: "An online shopping website.",
      },
    ];

    const createdProjects = [];
    for (const project of projects) {
      const createdProject = await prisma.project.create({ data: project });
      createdProjects.push(createdProject);
      console.log("Created project:", createdProject);
    }

    if (createdMembers.length < 2 || createdProjects.length < 2) {
      throw new Error(
        "Not enough valid members or projects to proceed with assignments."
      );
    }

    await prisma.memberProjects.deleteMany();
    console.log("Assigning members to projects...");

    await prisma.memberProjects.createMany({
      data: [
        {
          member_id: createdMembers[0].id,
          project_id: createdProjects[0].id,
          assigned_at: new Date("2025-01-01T10:00:00Z"),
        },
        {
          member_id: createdMembers[0].id,
          project_id: createdProjects[1].id,
          assigned_at: new Date("2025-01-01T10:00:00Z"),
        },
        {
          member_id: createdMembers[1].id,
          project_id: createdProjects[0].id,
          assigned_at: new Date("2025-01-02T15:30:00Z"),
        },
      ],
    });

    console.log("Member Assignments:");
    const assignments = await prisma.memberProjects.findMany({
      include: {
        member: true,
        project: true,
      },
    });

    assignments.forEach((assignment) => {
      console.log(
        `${assignment.member.name} (${assignment.member.role}) ➝ ${
          assignment.project.name
        } [Assigned: ${assignment.assigned_at.toISOString()}]`
      );
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error:", error.message);
    } else {
      console.error("An unknown error occurred.");
    }
  } finally {
    await prisma.$disconnect();
  }
};

main();
