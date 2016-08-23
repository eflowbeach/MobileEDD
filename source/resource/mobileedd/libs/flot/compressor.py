#!/usr/bin/python

import os,sys
print 'hello'
os.chdir(os.getcwd())
os.system('pwd')

output = 'flot-combo.js'
os.system('rm flot-combo.js')
os.system('cat jquery.min.js > ' + output)
os.system('cat jquery.flot.min.js >> ' + output)
os.system('cat jquery.flot.time.min.js >> ' + output)
os.system('cat jquery.flot.resize.min.js >> ' + output)
os.system('cat jquery.flot.canvas.min.js >> ' + output)
os.system('cat excanvas.min.js >> ' + output)
#
# filenames = ['usng.min.js', '../js/d3.min.js', 'MF_Combined.js', 'libs.js', 'EDDlibs.js']
# with open('COMBINED.js', 'w') as outfile:
#     for fname in filenames:
#         with open(fname) as infile:
#             outfile.write(infile.read())