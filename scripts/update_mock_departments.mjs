import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import path from 'path';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://fbvztmttixmmqorvqtbb.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

(async () => {
  const { data, error } = await supabase.from('departments').select('code, name, description, chief_coordinator, contact, icon_name');
  if (error) {
    console.error('Error fetching departments:', error);
    process.exit(1);
  }
  const lines = [];
  lines.push('export const DEPARTMENTS = [');
  data.forEach((dept, i) => {
    lines.push(`  {`);
    lines.push(`    id: 'dept-${dept.code.toLowerCase()}',`);
    lines.push(`    code: '${dept.code}',`);
    lines.push(`    name: '${dept.name.replace(/'/g, "\\'")}',`);
    lines.push(`    description: '${dept.description.replace(/'/g, "\\'")}',`);
    lines.push(`    chiefCoordinator: '${dept.chief_coordinator.replace(/'/g, "\\'")}',`);
    lines.push(`    contact: '${dept.contact}',`);
    lines.push(`    iconName: '${dept.icon_name}'`);
    lines.push(`  }${i < data.length - 1 ? ',' : ''}`);
  });
  lines.push('];');
  const outPath = path.resolve('src/data/mockData.ts');
  writeFileSync(outPath, lines.join('\n'));
  console.log('Mock data updated with', data.length, 'departments');
})();

