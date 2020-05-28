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

    // log=$(ssh root@10.183.177.118 "ls -t /data/log | head -1")
    // const target = execSync('ssh board "ls -t /data/log | head -1"', { encoding: 'utf-8'}); // the default is 'buffer'
    // scp root@10.183.177.118:/data/log/$log ~/logs

   //  execSync(`touch ~/logs/${target}`, { encoding: 'utf-8'}); // the default is 'buffer'
   //  execSync(`scp board:/data/log/${target} ~/logs/${target}`, { encoding: 'utf-8'}); // the default is 'buffer'
   //  execSync(`dlogparser ~/logs/${target} ~/logs`, { encoding: 'utf-8'}); // the default is 'buffer'
   //  execSync(`cp ~/logs/${target}.csv ~/bin/dlog/latest.csv`, { encoding: 'utf-8'}); // the default is 'buffer'
   //  console.log(`Latest DLog file: ${target}`, { encoding: 'utf-8'});
}

var target = `/home/tamausb/bin/dlog/latest.csv`
if (program.file) {
    target = program.file;
    console.log(program.file)
}
// process.exit(1);

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
   var row = lines[1].split(',', 4);
   console.log(`${row[3]}`);
   console.log('');

   var cols = [2,3];
   var queryList = [];
   var headers = [];
   if (program.errors == true) {
      queryList.push('_error');
      headers.push('Errors');
   }
   if (program.alarms == true) {
      queryList.push('Alarm raised: ');
      headers.push('Alarms');
   }
   if (program.search) {
      queryList.push(program.search);
      headers.push(`Misc Search: ${program.search}`);
   }
   search(lines, cols, queryList, headers, program.outFile);
   // console.log(program.opts());
});

function search(lines, searchColumns, queries, headers, outFile) {
   var results = {};
   for (h in headers) {
      results[headers[h]] = '';
   }

   var output = '';
   var i, j, k;
   for (i=0; i<lines.length; ++i) {
      var row = lines[i].split(',', 4);

      for (j = 0; j < searchColumns.length; ++j){
         var col = searchColumns[j];

         for (k = 0; k < queries.length; ++k){
            if (row[col] && row[col].search(new RegExp(queries[k], "i")) != -1) {
               results[headers[k]] += `[${row[0]}] ${row[1]}: ${row[2]}\n`;
               results[headers[k]] += `\t${row[3]}\n`;
               results[headers[k]] += '\n';

               if (outFile) {
                  output += row[0] + ',' + row[1] + ',' + row[2] + ',' + row[3] + ',\n'
               }
            }
         }
      }
   }

   for (h in headers) {
      var message = results[headers[h]];
      console.log(`---------------------- [[ ${headers[h]} ]] -------------------------------`);
      console.log(message);
   }

   if (outFile) {
      fs.writeFileSync(outFile, output);
   }
}
