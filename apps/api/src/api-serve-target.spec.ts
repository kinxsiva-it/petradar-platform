import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('api serve target', () => {
  it('starts the current emitted API with workspace alias support', () => {
    const project = JSON.parse(readFileSync(join(process.cwd(), 'apps/api/project.json'), 'utf8')) as {
      targets?: { serve?: { options?: { command?: string } } };
    };
    const command = project.targets?.serve?.options?.command ?? '';

    expect(command).toContain('apps/api/src/register-dist-paths.cjs');
    expect(command).toContain('dist/apps/api/apps/api/src/main.js');
    expect(existsSync(join(process.cwd(), 'apps/api/src/register-dist-paths.cjs'))).toBe(true);
  });
});
