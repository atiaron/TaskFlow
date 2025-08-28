const { exec } = require('child_process');

console.log('🔍 Running comprehensive TypeScript check...\n');

// Function to run command and return promise
function runCommand(command, description) {
  return new Promise((resolve, reject) => {
    console.log(`📋 ${description}...`);
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.log(`❌ ${description} failed:`);
        console.log(stderr || stdout);
        reject(error);
      } else {
        console.log(`✅ ${description} passed!`);
        if (stdout) console.log(stdout);
        resolve(stdout);
      }
    });
  });
}

async function checkAll() {
  try {
    await runCommand('npx tsc --noEmit', 'TypeScript Check');
    await runCommand('npm run build', 'Build Check');
    console.log('\n🎉 All checks passed! Ready for deployment!');
  } catch (error) {
    console.log('\n🚨 Checks failed! Fix errors before committing.');
    process.exit(1);
  }
}

checkAll();
