import { readdir, stat, readFile } from 'fs/promises';
import { join, extname, relative } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

/**
 * Рекурсивно проверяет синтаксис всех .js файлов в директории
 * Использует простую проверку баланса скобок и базовый синтаксический анализ
 */
async function checkSyntax(dir, errors = [], root = dir) {
  try {
    const entries = await readdir(dir);

    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stats = await stat(fullPath);

      // Пропускаем node_modules, uploads, .git и scripts (чтобы не проверять сам скрипт)
      if (
        entry === 'node_modules' ||
        entry === 'uploads' ||
        entry === '.git' ||
        entry === 'scripts'
      ) {
        continue;
      }

      if (stats.isDirectory()) {
        await checkSyntax(fullPath, errors, root);
      } else if (extname(entry) === '.js') {
        try {
          const content = await readFile(fullPath, 'utf-8');
          const relativePath = relative(root, fullPath);

          // Проверка баланса скобок
          const openBraces = (content.match(/{/g) || []).length;
          const closeBraces = (content.match(/}/g) || []).length;
          const openParens = (content.match(/\(/g) || []).length;
          const closeParens = (content.match(/\)/g) || []).length;
          const openBrackets = (content.match(/\[/g) || []).length;
          const closeBrackets = (content.match(/\]/g) || []).length;

          if (openBraces !== closeBraces) {
            errors.push({
              file: relativePath,
              error: `Несоответствие фигурных скобок: открывающих ${openBraces}, закрывающих ${closeBraces}`,
            });
          }

          if (openParens !== closeParens) {
            errors.push({
              file: relativePath,
              error: `Несоответствие круглых скобок: открывающих ${openParens}, закрывающих ${closeParens}`,
            });
          }

          if (openBrackets !== closeBrackets) {
            errors.push({
              file: relativePath,
              error: `Несоответствие квадратных скобок: открывающих ${openBrackets}, закрывающих ${closeBrackets}`,
            });
          }

          // Проверка на незакрытые строки
          const singleQuotes = (content.match(/'/g) || []).length;
          const doubleQuotes = (content.match(/"/g) || []).length;
          const backticks = (content.match(/`/g) || []).length;

          // Простая проверка: если количество кавычек нечетное, возможно незакрытая строка
          // Но это не точная проверка, так как могут быть экранированные кавычки
          // Поэтому только предупреждение

          // Проверка на базовые синтаксические ошибки
          const lines = content.split('\n');
          lines.forEach((line, index) => {
            // Проверка на незакрытые многострочные комментарии (базовая)
            if (line.includes('/*') && !line.includes('*/')) {
              // Это может быть начало многострочного комментария
              // Проверяем, есть ли закрытие дальше
              const restOfFile = lines.slice(index + 1).join('\n');
              if (!restOfFile.includes('*/')) {
                errors.push({
                  file: relativePath,
                  error: `Незакрытый многострочный комментарий на строке ${index + 1}`,
                });
              }
            }
          });
        } catch (error) {
          const relativePath = relative(root, fullPath);
          errors.push({
            file: relativePath,
            error: `Ошибка чтения файла: ${error.message}`,
          });
        }
      }
    }
  } catch (error) {
    console.error(`Ошибка при проверке директории ${dir}:`, error.message);
  }

  return errors;
}

// Основная функция
async function main() {
  console.log('🔍 Проверка синтаксиса JavaScript файлов в server/...\n');

  const errors = await checkSyntax(rootDir);

  if (errors.length > 0) {
    console.error('❌ Найдены потенциальные синтаксические проблемы:\n');
    errors.forEach(({ file, error }) => {
      console.error(`  📄 ${file}`);
      console.error(`     ⚠️  ${error}\n`);
    });
    console.error('💡 Для более детальной проверки используйте: npm run lint\n');
    process.exit(1);
  } else {
    console.log('✅ Все JavaScript файлы прошли базовую проверку синтаксиса');
    console.log('💡 Для более детальной проверки используйте: npm run lint\n');
  }
}

main().catch(error => {
  console.error('❌ Критическая ошибка:', error);
  process.exit(1);
});
