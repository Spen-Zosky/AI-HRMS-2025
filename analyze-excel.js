const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Files to analyze
const workbooks = [
  'FinNova_Org_JD_Skills.xlsx',
  'BioNova_Org_JD_Skills.xlsx',
  'EcoNova_Org_JD_Skills.xlsx',
  'BankNova_Org_JD_Skills.xlsx'
];

console.log('📊 Excel Workbook Analysis for POPULAT05');
console.log('=' .repeat(60));

const analysis = {};

workbooks.forEach(filename => {
  console.log(`\n📁 Analyzing: ${filename}`);
  console.log('-'.repeat(40));

  try {
    const workbook = XLSX.readFile(filename);
    const companyName = filename.split('_')[0];

    analysis[companyName] = {
      filename: filename,
      sheets: workbook.SheetNames,
      sheetData: {}
    };

    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet);

      console.log(`\n  📄 Sheet: ${sheetName}`);
      console.log(`     Rows: ${data.length}`);

      if (data.length > 0) {
        const columns = Object.keys(data[0]);
        console.log(`     Columns: ${columns.join(', ')}`);

        // Store sheet info
        analysis[companyName].sheetData[sheetName] = {
          rowCount: data.length,
          columns: columns,
          sampleData: data.slice(0, 2)
        };

        // Show sample data
        console.log('     Sample data (first 2 rows):');
        data.slice(0, 2).forEach((row, idx) => {
          console.log(`       Row ${idx + 1}:`, JSON.stringify(row).substring(0, 100) + '...');
        });
      }
    });

  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
    analysis[companyName] = { error: error.message };
  }
});

// Save analysis to file
fs.writeFileSync('excel-analysis.json', JSON.stringify(analysis, null, 2));

console.log('\n' + '=' .repeat(60));
console.log('📊 Analysis Summary:');
console.log('-'.repeat(40));

// Print summary
Object.keys(analysis).forEach(company => {
  const data = analysis[company];
  if (!data.error) {
    console.log(`\n${company}:`);
    console.log(`  - Sheets: ${data.sheets.join(', ')}`);

    Object.keys(data.sheetData).forEach(sheet => {
      const sheetInfo = data.sheetData[sheet];
      console.log(`  - ${sheet}: ${sheetInfo.rowCount} rows, ${sheetInfo.columns.length} columns`);
    });
  }
});

console.log('\n✅ Analysis complete! Results saved to excel-analysis.json');

// Create detailed report
console.log('\n' + '=' .repeat(60));
console.log('📋 DETAILED DATA STRUCTURE REPORT');
console.log('=' .repeat(60));

// Analyze structure for adaptation
Object.keys(analysis).forEach(company => {
  const data = analysis[company];
  if (!data.error && data.sheetData) {
    console.log(`\n🏢 ${company} Structure:`);

    // Check for Organigramma sheet
    if (data.sheetData['Organigramma']) {
      console.log('  ✓ Organigramma (Organization Chart) found');
      const cols = data.sheetData['Organigramma'].columns;
      console.log(`    Expected columns: Surname, Name, Role, Location`);
      console.log(`    Actual columns: ${cols.join(', ')}`);
    }

    // Check for Job Descriptions sheet
    if (data.sheetData['Job Descriptions']) {
      console.log('  ✓ Job Descriptions found');
      const cols = data.sheetData['Job Descriptions'].columns;
      console.log(`    Columns: ${cols.join(', ')}`);
    }

    // Check for Skills sheet
    if (data.sheetData['Skills']) {
      console.log('  ✓ Skills found');
      const cols = data.sheetData['Skills'].columns;
      console.log(`    Columns: ${cols.join(', ')}`);
    }
  }
});

console.log('\n✅ Detailed analysis complete!');