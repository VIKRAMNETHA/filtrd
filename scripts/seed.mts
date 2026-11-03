import { randomBytes, scryptSync } from "node:crypto";
import postgres from "postgres";

// Creates a second demo tenant, handy for seeing tenant isolation side by side.
const EMAIL = "hr@globex.example.com";
const PASSWORD = "hireflow-demo-pass";

const sql = postgres(process.env.DATABASE_URL!, { max: 1, onnotice: () => {} });

const [existing] = await sql`select 1 from organizations where slug = 'globex'`;
if (existing) {
  console.log("Demo tenant already exists.");
} else {
  const salt = randomBytes(16);
  const hash = `${salt.toString("hex")}:${scryptSync(PASSWORD, salt, 64).toString("hex")}`;
  const [user] = await sql`insert into users (email, name, password_hash) values (${EMAIL}, 'Gita Globex', ${hash}) returning id`;
  const [org] = await sql`
    insert into organizations (slug, name, tagline, about, brand_color)
    values ('globex', 'Globex Health', 'Care, delivered better', 'We build software for community clinics.', '#0f766e')
    returning id`;
  await sql.begin(async (tx) => {
    await tx`select set_config('app.org_id', ${org.id}, true)`;
    await tx`insert into org_settings (org_id, hr_email) values (${org.id}, ${EMAIL})`;
    await tx`insert into memberships (org_id, user_id) values (${org.id}, ${user.id})`;
    const [job] = await tx`
      insert into jobs (org_id, title, department, location, description, required_skills, threshold, active_days, notify_emails, status, published_at, closes_at)
      values (${org.id}, 'Clinical Data Analyst', 'Analytics', 'Bengaluru',
        'Turn clinic records into insight that improves patient outcomes, working closely with care teams.',
        ${["SQL", "Python"]}, 65, 30, ${[EMAIL]}, 'published', now(), now() + interval '30 days')
      returning id`;
    await tx`insert into job_rounds (org_id, job_id, position, name, kind) values (${org.id}, ${job.id}, 1, 'Panel interview', 'interview')`;
  });
  console.log(`Created Globex Health. Sign in as ${EMAIL} / ${PASSWORD}`);
}
await sql.end();
