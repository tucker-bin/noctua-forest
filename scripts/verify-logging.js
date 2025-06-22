const fs = require('fs');
const path = require('path');

function findTsFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.includes('node_modules') && !item.includes('dist') && !item.includes('build')) {
      findTsFiles(fullPath, files);
    } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx'))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  const analysis = {
    hasConsoleStatements: false,
    consoleLines: [],
    hasLoggerImport: false,
    hasLogStatements: false,
    logStatements: 0,
    issues: []
  };
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();
    
    // Check for console statements (excluding comments)
    if (trimmed.includes('console.') && !trimmed.startsWith('//') && !trimmed.startsWith('*')) {
      analysis.hasConsoleStatements = true;
      analysis.consoleLines.push({ line: lineNum, content: trimmed });
    }
    
    // Check for logger import
    if (trimmed.includes('from \'../utils/logger\'') || trimmed.includes('from \'../../utils/logger\'')) {
      analysis.hasLoggerImport = true;
    }
    
    // Check for log statements
    if (trimmed.includes('log.') || trimmed.includes('logger.')) {
      analysis.hasLogStatements = true;
      analysis.logStatements++;
    }
  });
  
  // Identify issues
  if (analysis.hasConsoleStatements) {
    analysis.issues.push('Still contains console statements');
  }
  
  if (analysis.hasLogStatements && !analysis.hasLoggerImport) {
    analysis.issues.push('Uses logging but missing logger import');
  }
  
  return analysis;
}

function generateReport() {
  console.log('🔍 Verifying logging implementation...\n');
  
  const srcFiles = findTsFiles('./src');
  const backendFiles = fs.existsSync('./node-backend/src') ? findTsFiles('./node-backend/src') : [];
  const allFiles = [...srcFiles, ...backendFiles];
  
  let totalFiles = allFiles.length;
  let filesWithConsole = 0;
  let filesWithLogging = 0;
  let filesWithIssues = 0;
  const issueDetails = [];
  
  console.log(`📁 Analyzing ${totalFiles} TypeScript files...\n`);
  
  allFiles.forEach(filePath => {
    const analysis = analyzeFile(filePath);
    
    if (analysis.hasConsoleStatements) {
      filesWithConsole++;
    }
    
    if (analysis.hasLogStatements) {
      filesWithLogging++;
    }
    
    if (analysis.issues.length > 0) {
      filesWithIssues++;
      issueDetails.push({
        file: filePath,
        issues: analysis.issues,
        consoleLines: analysis.consoleLines
      });
    }
  });
  
  // Summary Report
  console.log('📊 LOGGING VERIFICATION REPORT');
  console.log('═'.repeat(50));
  console.log(`📁 Total files analyzed: ${totalFiles}`);
  console.log(`✅ Files with proper logging: ${filesWithLogging}`);
  console.log(`❌ Files still using console: ${filesWithConsole}`);
  console.log(`⚠️  Files with issues: ${filesWithIssues}`);
  console.log('');
  
  // Coverage Statistics
  const loggingCoverage = ((filesWithLogging / totalFiles) * 100).toFixed(1);
  const consoleFree = ((totalFiles - filesWithConsole) / totalFiles * 100).toFixed(1);
  
  console.log('📈 COVERAGE STATISTICS');
  console.log('─'.repeat(30));
  console.log(`🎯 Logging adoption: ${loggingCoverage}%`);
  console.log(`🚫 Console-free files: ${consoleFree}%`);
  console.log('');
  
  // Issue Details
  if (issueDetails.length > 0) {
    console.log('⚠️  ISSUES FOUND');
    console.log('─'.repeat(30));
    
    issueDetails.forEach(({ file, issues, consoleLines }) => {
      console.log(`📄 ${file}`);
      issues.forEach(issue => {
        console.log(`   ❌ ${issue}`);
      });
      
      if (consoleLines.length > 0) {
        console.log('   Console statements found:');
        consoleLines.forEach(({ line, content }) => {
          console.log(`     Line ${line}: ${content}`);
        });
      }
      console.log('');
    });
  }
  
  // Recommendations
  console.log('💡 RECOMMENDATIONS');
  console.log('─'.repeat(30));
  
  if (filesWithConsole > 0) {
    console.log('🔧 Replace remaining console statements with proper logging');
    console.log('   - Use log.info() for general information');
    console.log('   - Use log.error() for errors with context');
    console.log('   - Use log.warn() for warnings');
    console.log('   - Use log.debug() for development debugging');
  }
  
  if (filesWithIssues === 0) {
    console.log('🎉 All files are properly configured for logging!');
    console.log('✅ No console statements found');
    console.log('✅ Logger imports are properly configured');
  }
  
  console.log('');
  console.log('📋 NEXT STEPS');
  console.log('─'.repeat(30));
  console.log('1. Review any remaining issues above');
  console.log('2. Test logging in development and production');
  console.log('3. Configure external logging services (Sentry, etc.)');
  console.log('4. Set up log monitoring and alerting');
  console.log('5. Document logging best practices for the team');
  
  return {
    totalFiles,
    filesWithLogging,
    filesWithConsole,
    filesWithIssues,
    loggingCoverage: parseFloat(loggingCoverage),
    consoleFree: parseFloat(consoleFree)
  };
}

if (require.main === module) {
  generateReport();
}

module.exports = { analyzeFile, generateReport }; 