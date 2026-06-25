#!/usr/bin/env node
import { Command } from 'commander'
import { VERSION } from './version.js'

const program = new Command()
program
  .name('tojiru')
  .description('Transforme un document à pages fixes en lecteur web statique')
  .version(VERSION)

program.parseAsync(process.argv)
