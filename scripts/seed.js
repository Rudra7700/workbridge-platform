import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lmcrczjhgfzocdcmpycq.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtY3JjempoZ2Z6b2NkY21weWNxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTEzNzI1OCwiZXhwIjoyMDg2NzEzMjU4fQ.K8xgFAX2O4E0rdQwl1ldl5xVPDni39SsfDlGGWlgt3E'

const supabase = createClient(supabaseUrl, supabaseKey)

const mpLocations = ['Bhopal, MP', 'Indore, MP', 'Jabalpur, MP', 'Gwalior, MP', 'Ujjain, MP']
const skillsList = ['Plumbing', 'Electrical', 'Carpentry', 'Painting', 'Cleaning', 'Masonry', 'Welding']

async function seed() {
  console.log('Starting MP Seed Data Generation...')

  let insertedWorkers = 0
  let insertedEmployers = 0
  let insertedJobs = 0

  for (let i = 1; i <= 10; i++) {
    const userId = crypto.randomUUID()
    const location = mpLocations[Math.floor(Math.random() * mpLocations.length)]
    const skills = [skillsList[Math.floor(Math.random() * skillsList.length)], skillsList[Math.floor(Math.random() * skillsList.length)]]

    const { error: profileError } = await supabase.from('profiles').insert({
      id: userId,
      name: `Manoj Kumar ${i}`,
      role: 'worker',
      phone: `+9198765432${i.toString().padStart(2, '0')}`,
      rating: (Math.random() * 2 + 3).toFixed(1),
      verified: true,
      aadhaar_verified: true
    })

    if (profileError) {
      console.error('Profile error:', profileError)
      continue
    }

    const mockEmbedding = Array(384).fill(0).map(() => Math.random() - 0.5)

    const { error: workerError } = await supabase.from('worker_profiles').insert({
      user_id: userId,
      skills,
      experience: Math.floor(Math.random() * 10) + 1,
      wage_expectation: Math.floor(Math.random() * 500) + 300,
      location: location,
      embedding: mockEmbedding
    })

    if (workerError) {
      console.error('Worker profile error:', workerError)
      continue
    }

    insertedWorkers++
    console.log(`Created worker ${i}: ${userId}`)
  }

  for (let i = 1; i <= 2; i++) {
    const employerId = crypto.randomUUID()

    const { error: empError } = await supabase.from('profiles').insert({
      id: employerId,
      name: `Sharma Constructions ${i}`,
      role: 'employer',
      phone: `+9188888888${i.toString().padStart(2, '0')}`,
      rating: 4.5,
      verified: true,
      aadhaar_verified: true
    })

    if (empError) {
      console.error('Employer error:', empError)
      continue
    }

    insertedEmployers++
    console.log(`Created employer ${i}: ${employerId}`)

    for (let j = 1; j <= 3; j++) {
      const location = mpLocations[Math.floor(Math.random() * mpLocations.length)]
      const skill = skillsList[Math.floor(Math.random() * skillsList.length)]
      const mockEmbedding = Array(384).fill(0).map(() => Math.random() - 0.5)

      const { error: jobError } = await supabase.from('jobs').insert({
        employer_id: employerId,
        title: `Need urgent ${skill} expert`,
        description: `हम एक ${skill} की तलाश कर रहे हैं जो ${location} में तुरंत काम शुरू कर सके।`,
        skill_tags: [skill],
        wage: Math.floor(Math.random() * 500) + 400,
        location_text: location,
        status: 'open',
        embedding: mockEmbedding
      })

      if (jobError) {
        console.error('Job error:', jobError)
        continue
      }

      insertedJobs++
      console.log(`Created job ${j} for employer ${i}`)
    }
  }

  console.log(`\nSeeded ${insertedWorkers} Workers, ${insertedEmployers} Employers, and ${insertedJobs} Jobs.`)
}

seed().catch(console.error)
