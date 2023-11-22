import { formatFiles, getProjects, installPackagesTask, Tree } from '@nx/devkit'
import { getNpmScope } from '@nx/js/src/utils/package-json/get-npm-scope'
import { anchorApplicationGenerator } from '@solana-developers/preset-anchor'
import { applicationCleanup } from '@solana-developers/preset-common'
import { getProjectRoots } from 'nx/src/utils/command-line-utils'
import { join } from 'path'
import {
  applicationTailwindConfig,
  generateReactApplication,
  NormalizedReactApplicationSchema,
  normalizeReactApplicationSchema,
  reactApplicationDependencies,
  walletAdapterDependencies,
} from '../../utils'
import reactTemplateGenerator from '../react-template/react-template-generator'
import { ReactApplicationSchema } from './react-application-schema'

export async function reactApplicationGenerator(tree: Tree, rawOptions: ReactApplicationSchema) {
  const options: NormalizedReactApplicationSchema = normalizeReactApplicationSchema(rawOptions)
  const npmScope = getNpmScope(tree)
  // Set up the base project.
  const project = await generateReactApplication(tree, options)
  // Clean up the default project files.
  applicationCleanup(tree, join(project.sourceRoot, 'app'))

  // Generate the base files from the templates.
  await reactTemplateGenerator(tree, {
    name: options.webName,
    npmScope,
    template: 'base',
    anchor: options.anchor,
    anchorName: options.anchorName,
    webName: options.webName,
    directory: project.root,
  })

  // Generate the ui files from the templates.
  await reactTemplateGenerator(tree, {
    name: options.webName,
    npmScope,
    template: options.ui,
    anchor: options.anchor,
    anchorName: options.anchorName,
    webName: options.webName,
    directory: project.root,
  })

  // Add the dependencies for the base application.
  reactApplicationDependencies(tree, options)

  // Add the dependencies for the wallet adapter.
  walletAdapterDependencies(tree)

  if (options.ui === 'tailwind') {
    // Add the tailwind config.
    await applicationTailwindConfig(tree, options.webName)
  }

  if (options.anchor !== 'none' && !getProjects(tree).has(options.anchorName)) {
    // Add the anchor application.
    await anchorApplicationGenerator(tree, {
      name: options.anchorName,
      skipFormat: true,
      template: options.anchor,
    })
  }

  // Format the files.
  if (!options.skipFormat) {
    await formatFiles(tree)
  }

  // Install the packages on exit.
  return () => {
    installPackagesTask(tree, true)
  }
}

export default reactApplicationGenerator
