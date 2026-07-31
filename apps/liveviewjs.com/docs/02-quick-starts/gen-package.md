---
sidebar_position: 6
---

# Project and LiveView Generation

**LiveViewJS** code generation command line interface for NodeJS and Deno.  Currently, the `@liveviewjs/gen` can generate a new LiveViewJS project or add new LiveViews to an existing project.

## Run

The `@liveviewjs/gen` package is a command line interface that will generate a new LiveViewJS project or add a liveview to your existing project.  If you run it without any options, you will be prompted to select a generator and provide configuration details for the generator - e.g. a name for the project or liveview and whether to run installation commands.

```bash
npx @liveviewjs/gen@latest
```

:::tip 

Auto-accept npx package insall

If you don't want `npx` to ask you to install the `@liveviewjs/gen` package you can tell it to automatically do so with the `--yes` option.
  
```bash
npx --yes @liveviewjs/gen@latest
```

:::

## Command Line Options

The `@liveviewjs/gen` package has a few command line options that can be used to automate the process of generating a new project or liveview.

### Help Option
To see the available options, run:
```bash
npx --yes @liveviewjs/gen@latest --help
```
prints
```
Options:
      --help       Show help                                           [boolean]
      --version    Show version number                                 [boolean]
  -g, --generator  Generator to run                                     [string]
  -n, --name       Name of the project                                  [string]
  -q, --quiet      Suppress all output                                 [boolean]
  -f, --force      Overwrite existing files                            [boolean]
```

### Generator Option

The following generators are available:

- `node` - generates a new NodeJS project
- `deno` - generates a new Deno project
- `liveview` - generates a LiveView and adds it to an existing project and router

To run a specific generator, use the `-g` or `--generator` option:
```bash
npx --yes @liveviewjs/gen@latest -g node
```
or
```bash
npx --yes @liveviewjs/gen@latest -g liveview
```

If you do not specify a generator, you will be prompted to select one.

### Name Option

For both project generators and liveview generators, the `-n` or `--name` option will set the name of generated item.  If not specified, you will be prompted to enter a name.

```bash
npx --yes @liveviewjs/gen@latest -g node -n my-liveview-project
```

### Project Options

The following options are available for the `node` and `deno` generators:

#### Install Dependencies Option

Once you've chosen a generator and entered a name, you will be prompted to install the dependencies.  If you want to automatically install the dependencies, use the `-i` or `--install` option.

```bash
npx --yes @liveviewjs/gen@latest -g node -n my-liveview-project -i
```

### LiveView Options

The following options are available for the `liveview` generator:

#### Router Option

When creating a new liveview, the generator needs to know what route should be mapped to the liveview and you will be prompted to provide a route.  If you want to automatically provide a route, use the `-r` or `--router` option.

```bash
npx --yes @liveviewjs/gen@latest -g liveview -r "/my-liveview"
```

#### Template Option

When creating a new liveview, the generator needs to know what template should be used for the liveview:

- `min` a liveview with just the `render` method stubbed out
- `max` a liveview with all the lifecycle hooks stubbed out

 If you want to automatically provide the template option, use the `-t` or `--template` option.

```bash
npx --yes @liveviewjs/gen@latest -g liveview -t min
```

#### Runtime Option

When creating a new liveview, the generator needs to know what runtime you are targeting: `node` or `deno`.  If you want to automatically provide the runtime option, use the `-n` or `--runtime` option. 



```bash
npx --yes @liveviewjs/gen@latest -g liveview -n deno
```

:::note

There are slight differences between "import" across NodeJS and Deno - Node eschews file extensions, while Deno requires them.  Unfortunately, the generator doesn't detect the runtime yet so you will need to specify it.  We hope to add detection in the future.

:::

## Future Generators

We expect to add more generators in the future particularly for the following:
- `example` - pick an example LiveView from our examples to add to your project
- `livecomponent` - generate a LiveComponent
