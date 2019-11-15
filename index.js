#!/usr/bin/env node

// form:
//  https://stackoverflow.com/questions/1880198/how-to-execute-shell-command-in-javascript
var execSync = require('child_process').execSync;

var program = require('commander'); // npm install --save commander
program
   .option('-s, --search <misc term to search for>', 'Misc query to find')
   .option('-f, --file <file>', 'File to parse, default is ~/bin/dlog/latest.csv')
   .option('-u, --update', 'Update the latest.csv file')
   .option('-e, --no-errors', 'Do not print out *_error entries')
   .option('-a, --no-alarms', 'Do not print out alarms')
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
   // column 0 is the line number
   // column 1 has the time stamp
   // column 2 output type (*_error, *_info) and file the message comes from
   // column 3 output message

   // Print out Errors
   console.log('---------------------- [[ File ]] -------------------------------');
   console.log(`From file: ${target}`)
   var row = lines[1].split(',');
   console.log(`${row[3]}`);
   console.log('');

   if (program.errors == true) {
      search(lines, '_error', 'Errors')
   }

   if (program.alarms == true) {
      search(lines, 'Alarm raised', 'Alarms')
   }

   if (program.search) {
      search(lines, program.search, `Misc Search: ${program.search}`)
   }
});

function search(lines, query, header) {
   console.log(`---------------------- [[ ${header} ]] -------------------------------`);
   var i;
   for (i=0; i<lines.length; ++i) {
      var row = lines[i].split(',');
      if (row[2] && row[2].search(new RegExp(query, "i")) != -1) {
         console.log('-------------------------------------------------------------------');
         console.log(`${row[1]}: ${row[2]}`);
         console.log(`\t${row[3]}`);
         console.log('');
      }
   }
   console.log('');
}

// console.log(program.opts());