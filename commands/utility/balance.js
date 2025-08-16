// import { createClient } from '@supabase/supabase-js'

// const supabaseUrl = 'https://sercxhohulnwvynvhgzf.supabase.co'
// const supabaseKey = process.env.SUPABASE_KEY
// const supabase = createClient(supabaseUrl, supabaseKey)

// export async function connectToDatabase() {
//     const { data, error } = await supabase.auth.signInWithPassword({
//         email: process.env.SUPABASE_LOGIN,
//         password: process.env.SUPABASE_PASSWORD,
//     })
//     if (error) {
//         console.error('Error connecting to Supabase:', error.message)
//         throw new Error('Database connection failed')
//     }
//     return;
// }
