const { ProjectName, NpmInstall } = require('../../prompts');

module.exports = {
  prompt: async ({ prompter, args }) => {
    const name = await ProjectName({ prompter, args });
    const install = await NpmInstall({ prompter, args });
    const results = {
      ...name,
      ...install,
    };
    console.log(results);
    return results;
  },
};
