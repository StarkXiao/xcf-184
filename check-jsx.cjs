const fs = require('fs');
const content = fs.readFileSync('src/components/MainMenu.tsx', 'utf8');
const lines = content.split('\n');
const stack = [];

lines.forEach((line, i) => {
  const lineNum = i + 1;
  
  const allDivs = line.match(/<div[^>]*>/g) || [];
  const closeMatches = line.match(/<\/div>/g) || [];
  
  const actualOpens = allDivs.filter(m => !m.endsWith('/>'));
  
  actualOpens.forEach(m => {
    const classMatch = m.match(/className="([^"]*)"/);
    stack.push({ line: lineNum, class: classMatch ? classMatch[1] : 'unknown', tag: m });
  });
  
  closeMatches.forEach(m => {
    if (stack.length > 0) {
      stack.pop();
    } else {
      console.log('Line ' + lineNum + ': extra closing tag');
    }
  });
});

console.log('Unclosed tags (stack length: ' + stack.length + '):');
stack.forEach(s => {
  console.log('  Line ' + s.line + ': ' + (s.class || s.tag.substring(0, 60)));
});
