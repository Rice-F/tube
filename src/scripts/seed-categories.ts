import { db } from '@/db'
import { categories } from '@/db/schema'

const categoryNames = [
  'Cars and vehicles',
  'Comedy',
  'Education',
  'Gaming',
  'Entertainment',
  'Film and animation',
  'How-to and style',
  'Music',
  'News and politics',
  'People and blogs',
  'Pets and animals',
  'Science and technology',
  'Sports',
  'Travel and events',
]

async function main () {
  try{
    const value = categoryNames.map(name => ({
      name,
      description: `Video related to ${name.toLowerCase()}`,
    }))
    await db.insert(categories).values(value);
  }catch(error) {
    console.log('Error seeding categories:', error);
    process.exit(1); // 终止进程，非正常退出
  }
}
main()