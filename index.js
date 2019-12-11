#!/usr/bin/env node

// form:
//  https://stackoverflow.com/questions/1880198/how-to-execute-shell-command-in-javascript
var execSync = require('child_process').execSync;

var program = require('commander'); // npm install --save commander
program
   .option('-a, --no-alarms', 'Do not print out alarms')
   .option('-e, --no-errors', 'Do not print out *_error entries')
   .option('-f, --file <file>', 'File to parse, default is ~/bin/dlog/latest.csv')
   .option('-o, --out-file <file>', 'File to write results to')
   .option('-s, --search <query>', 'Misc query to find')
   .option('-u, --update', 'Update the latest.csv file')
   .on('--help', function (){
      console.log('');
      console.log('Common terms to search for:');
      console.log('-- Finding available nodes:');
      console.log('\t"Discover bus" // doesn\'t work for some reason, just use "bus" ');
      console.log('');
      console.log('-- Determine which nodes are in programming mode');
      console.log('\t_CanNodeProgrammer');
      console.log('');
      console.log('-- Stages of mender update and firmware update');
      console.log('\t"Mender update triggered"');
      console.log('\t"mender install"');
      console.log('\t"mender verify"');
      console.log('\t"firmware update triggered"');
      console.log('\t"verify in process"');
      console.log('\t"mender update"');
      console.log('');
      console.log('-- Process Status transistions');
      console.log('\t"ProcessStatus"');
      console.log('');
   }).parse(process.argv);

if (program.update) {
    console.log('Pulling over latest DLog...')
    const output = execSync('~/bin/grabLatest.sh', { encoding: 'utf-8'}); // the default is 'buffer'
    console.log(output);
}

var target = `/home/tamausb/bin/dlog/latest.csv`
if (program.file) {
    target = program.file;
}

const fs = require('fs');
const readline = require('readline');

const fileStream = fs.createReadStream(target);
const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
});

var lines = [];
rl.on('line', (line) => {
    lines.push( line );
}).on('close', () => {
   // print out file description, found in column 4
   // column 0 is the count number
   // column 1 has the time stamp
   // column 2 output type (*_error, *_info) and file the message comes from
   // column 3 output message

   // Print out Errors
   console.log('---------------------- [[ File ]] -------------------------------');
   console.log(`From file: ${target}`)
   var row = lines[1].split(',');
   console.log(`${row[3]}`);
   console.log('');

   var cols = [2,3];
   var queryList = [];
   var searchHeader = [];
   if (program.search) {
      queryList.append(program.search);
      searchHeader.append(`Misc Search: ${program.search}`);
   }
   if (program.errors == true) {
      queryList.append('_error');
      searchHeader.append('Errors');
   }
   if (program.alarms == true) {
      queryList.append('Alarm raised: ');
      searchHeader.append('Alarms');
   }

   if (program.search) {
      misc_search(lines, program.search, `Misc Search: ${program.search}`);
   }
   else {
      if (program.errors == true) {
         search(lines, 2, '_error', 'Errors')
      }

      if (program.alarms == true) {
         search(lines, 3, 'Alarm raised: ', 'Alarms')
      }
   }

   if (program.outFile) {
      var output = '';
      var i;
      for (i=0; i<lines.length; ++i) {
         var row = lines[i].split(',');
         if (row[2]) {
            var anyErrors = (row[2].search(new RegExp('_error', "i")) != -1);
            var customSearch = false;
            if (program.search) {
               customSearch = (row[2].search(new RegExp(program.search, "i")) != -1);
            }

            if ( anyErrors || customSearch ) {
               output += row[0] + ',' + row[1] + ',' + row[2] + ',' + row[3] + ',\n'
            }
         }
         else if (row[3]) {
            var anyAlarms = (row[3].search(new RegExp('Alarm raised:', "i")) != -1);
            var customSearch = false;
            if (program.search) {
               customSearch = (row[3].search(new RegExp(program.search, "i")) != -1);
            }

            if ( anyAlarms || customSearch ) {
               output += row[0] + ',' + row[1] + ',' + row[2] + ',' + row[3] + ',\n'
            }
         }
      }
      fs.writeFileSync(program.outFile, output);
   }

   // console.log(program.opts());
});

function search(lines, searchColumns, queries, headers) {
   var i;
   for (i=0; i<lines.length; ++i) {
      var row = lines[i].split(',');

      var j = 0;
      for (j = 0; j < searchColumns.length; ++j){
         console.log(`---------------------- [[ ${headers[j]} ]] -------------------------------`);

         var col = searchColumns[j];
         if (row[col] && row[col].search(new RegExp(queries[j], "i")) != -1) {
            console.log('-------------------------------------------------------------------');
            console.log(`${row[0]}[]${row[1]}: ${row[2]}`);
            console.log(`\t${row[3]}`);
            console.log('');
         }
      }
      console.log('');
   }
}
function search(lines, searchColumn, query, header) {
   console.log(`---------------------- [[ ${header} ]] -------------------------------`);
   var i;
   for (i=0; i<lines.length; ++i) {
      var row = lines[i].split(',');
      if (row[searchColumn] && row[searchColumn].search(new RegExp(query, "i")) != -1) {
         console.log('-------------------------------------------------------------------');
         console.log(`${row[0]}[]${row[1]}: ${row[2]}`);
         console.log(`\t${row[3]}`);
         console.log('');
      }
   }
   console.log('');
}

function misc_search(lines, query, header) {
   console.log(`---------------------- [[ ${header} ]] -------------------------------`);
   var i;
   for (i=0; i<lines.length; ++i) {
      var row = lines[i].split(',');
      var col2 = (row[2] && row[2].search(new RegExp(query, "i")) != -1);
      var col3 = (row[2] && row[2].search(new RegExp(query, "i")) != -1);
      if (col2 || col3) {
         console.log('-------------------------------------------------------------------');
         console.log(`${row[0]}[]${row[1]}: ${row[2]}`);
         console.log(`\t${row[3]}`);
         console.log('');
      }
   }
   console.log('');
}