import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const hash = (pw: string) => bcrypt.hash(pw, 10);

async function upsertUser(opts: {
  name: string;
  username: string;
  password: string;
  role: string;
}) {
  return prisma.user.upsert({
    where: { username: opts.username },
    update: { name: opts.name, role: opts.role },
    create: {
      name: opts.name,
      username: opts.username,
      role: opts.role,
      passwordHash: await hash(opts.password),
    },
  });
}

async function main() {
  console.log("Seeding Mindcob Content Studio…");

  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "123";
  const admin = await upsertUser({ name: "Studio Admin", username: "admin", password: adminPassword, role: "ADMIN" });

  // Production: set SEED_DEMO=false to create ONLY the admin (no demo accounts).
  if (process.env.SEED_DEMO === "false") {
    console.log("Admin-only seed complete. Login → username: admin");
    return;
  }

  const umar = await upsertUser({ name: "Umar", username: "umar", password: "umar123", role: "REVIEWER" });
  const waqar = await upsertUser({ name: "Waqar", username: "waqar", password: "waqar123", role: "REVIEWER" });
  const ayesha = await upsertUser({ name: "Ayesha Khan", username: "ayesha", password: "ayesha123", role: "WRITER" });
  const hamza = await upsertUser({ name: "Hamza Ali", username: "hamza", password: "hamza123", role: "WRITER" });
  const sara = await upsertUser({ name: "Sara Malik", username: "sara", password: "sara123", role: "DESIGNER" });

  // Fresh content + projects each seed.
  await prisma.notification.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.projectMember.deleteMany({});
  await prisma.project.deleteMany({});

  const mindcob = await prisma.project.create({
    data: {
      name: "Mindcob",
      website: "https://mindcob.com",
      description: "Mindcob toolbox & content marketing site.",
      createdById: admin.id,
    },
  });
  const acme = await prisma.project.create({
    data: {
      name: "Acme Corp",
      website: "https://acme.example.com",
      description: "Acme marketing website & blog.",
      createdById: admin.id,
    },
  });

  // Who works on which project.
  await prisma.projectMember.createMany({
    data: [
      ...[ayesha.id, hamza.id, umar.id, waqar.id, sara.id].map((userId) => ({ projectId: mindcob.id, userId })),
      ...[ayesha.id, umar.id, sara.id].map((userId) => ({ projectId: acme.id, userId })),
    ],
  });

  type Sample = {
    title: string;
    project: "mindcob" | "acme";
    contentType: string;
    status: string;
    writerId?: string;
    designerId?: string;
    guideText?: string;
    contentText?: string;
    designInstructions?: string;
    websiteLink?: string;
    remarks?: string;
    approvals?: string[];
  };

  const projectMap: Record<string, string> = { mindcob: mindcob.id, acme: acme.id };

  const samples: Sample[] = [
    {
      title: "10 Ways to Improve Your Home Office Setup",
      project: "acme",
      contentType: "Blog Post",
      status: "ASSIGNED",
      writerId: ayesha.id,
      guideText:
        "Target keyword: home office setup. 1200+ words, friendly tone, 6 H2 sections, include a product roundup and an FAQ.",
      remarks: "Priority for next week's newsletter.",
    },
    {
      title: "Managed IT Services — Toronto",
      project: "mindcob",
      contentType: "Service Page",
      status: "IN_PROGRESS",
      writerId: hamza.id,
      guideText:
        "Primary keyword: managed IT services Toronto. Local intent. Include benefits, our process, and 3 CTAs.",
    },
    {
      title: "Ultimate Guide to Cold Email Outreach",
      project: "mindcob",
      contentType: "Blog Post",
      status: "WRITTEN",
      writerId: ayesha.id,
      guideText: "Keyword: cold email outreach. 1800 words, actionable, include templates.",
      contentText:
        "Cold email is still one of the highest-ROI channels for B2B teams. In this guide we break down deliverability, subject lines, personalization at scale, and follow-up cadences that actually get replies…",
    },
    {
      title: "Spring Sale Landing Page",
      project: "mindcob",
      contentType: "Landing Page",
      status: "IMPROVEMENT",
      writerId: hamza.id,
      guideText: "Punchy, conversion-focused. Hero, benefits, social proof, urgency, CTA.",
      contentText:
        "Spring into savings. Up to 40% off everything. Our biggest sale of the season is here…",
      remarks: "Hero copy is weak — needs a stronger hook and a clearer offer.",
    },
    {
      title: "How AI Is Changing Customer Support",
      project: "acme",
      contentType: "Blog Post",
      status: "REVIEWED_BY_UMAR",
      writerId: ayesha.id,
      guideText: "Keyword: AI customer support. Balanced, cite examples, 1500 words.",
      contentText:
        "From deflection to full resolution, AI is reshaping how support teams operate. Here's what's real, what's hype, and how to roll it out responsibly…",
      approvals: [umar.id],
    },
    {
      title: "Premium Wireless Earbuds — Product Description",
      project: "mindcob",
      contentType: "Product Description",
      status: "REVIEWED_BY_WAQAR",
      writerId: hamza.id,
      guideText: "Sensory, benefit-led, 150 words, include specs bullet list.",
      contentText:
        "Immersive sound, all day. Our flagship earbuds deliver studio-grade audio with adaptive noise cancellation and 32 hours of battery…",
      approvals: [umar.id, waqar.id],
    },
    {
      title: "Case Study: 3x Pipeline in 90 Days",
      project: "mindcob",
      contentType: "Case Study",
      status: "DESIGN_NOW",
      writerId: ayesha.id,
      designerId: sara.id,
      guideText: "Problem / solution / results structure. Pull 3 key metrics.",
      contentText:
        "When Northwind partnered with us, their pipeline was flat. Ninety days later they had tripled qualified opportunities…",
      designInstructions:
        "Brand palette, pull the 3 metrics into big stat callouts, 2-column layout, add a results chart.",
      approvals: [umar.id, waqar.id],
    },
    {
      title: "Q3 Product Newsletter",
      project: "mindcob",
      contentType: "Email",
      status: "DESIGNING",
      writerId: hamza.id,
      designerId: sara.id,
      guideText: "3 feature highlights + one customer story. Keep it skimmable.",
      contentText:
        "Big things shipped this quarter. Here's what's new, what's improved, and what customers are saying…",
      designInstructions: "Email-safe layout, single column, 600px, clear buttons.",
      approvals: [umar.id, waqar.id],
    },
    {
      title: "SEO Fundamentals for Founders",
      project: "mindcob",
      contentType: "Blog Post",
      status: "POSTED",
      writerId: ayesha.id,
      designerId: sara.id,
      guideText: "Beginner-friendly, keyword: SEO for founders, 2000 words.",
      contentText:
        "You don't need to be a technical wizard to get SEO right. This founder's guide covers the 20% that drives 80% of results…",
      designInstructions: "Featured image + 4 inline diagrams.",
      websiteLink: "https://mindcob.com/blog/seo-fundamentals-for-founders",
      approvals: [umar.id, waqar.id],
    },
    {
      title: "Black Friday Teaser — Social",
      project: "mindcob",
      contentType: "Social Post",
      status: "CANCELLED",
      writerId: hamza.id,
      guideText: "Short, punchy, 3 variants for IG/LinkedIn/X.",
      remarks: "Campaign postponed to next quarter.",
    },
  ];

  let n = 0;
  for (const s of samples) {
    n += 1;
    const refCode = `MC-${String(n).padStart(4, "0")}`;
    const words = s.contentText ? s.contentText.trim().split(/\s+/).length : 0;
    const task = await prisma.task.create({
      data: {
        refCode,
        title: s.title,
        projectId: projectMap[s.project],
        contentType: s.contentType,
        status: s.status,
        guideText: s.guideText,
        contentText: s.contentText,
        words,
        writerId: s.writerId,
        designerId: s.designerId,
        designInstructions: s.designInstructions,
        websiteLink: s.websiteLink,
        remarks: s.remarks,
        createdById: admin.id,
        statusHistory: {
          create: { toStatus: s.status, byId: admin.id, note: "Seeded" },
        },
      },
    });

    if (s.approvals && s.approvals.length) {
      for (const reviewerId of s.approvals) {
        await prisma.reviewApproval.create({
          data: { taskId: task.id, reviewerId, note: "Looks good." },
        });
      }
    }
  }

  await prisma.notification.create({
    data: {
      userId: ayesha.id,
      type: "ASSIGNED",
      message: "You have been assigned: 10 Ways to Improve Your Home Office Setup",
    },
  });
  await prisma.notification.create({
    data: {
      userId: admin.id,
      type: "SUBMITTED",
      message: "Ayesha submitted: Ultimate Guide to Cold Email Outreach",
    },
  });

  console.log("Seed complete.");
  console.log("Admin login →  username: admin");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
