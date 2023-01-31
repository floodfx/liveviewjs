// copied from: https://github.com/jondot/hygen/issues/35
const { Gatherer } = require('./Gatherer');

async function ProjectName({ prompter, args = {} }) {
  return Gatherer([
    {
      type: 'input',
      name: 'name',
      message: "What should we call this project?",
    },    
  ])({ prompter, args });
}

async function NpmInstall({ prompter, args = {} }) {
  return Gatherer([
    {
      type: 'confirm',
      name: 'install',
      message: "Should we run npm install for you?",
    },    
  ])({ prompter, args });
}

module.exports = {
  ProjectName,
  NpmInstall
}
