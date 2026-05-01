const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Watch all files in the monorepo (needed for shared convex types)
config.watchFolders = [workspaceRoot];

// Resolve modules from both the app and the workspace root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// Fix: Metro on Windows fails to resolve relative requires inside assert/build/
// Chain: expo-notifications -> @ide/backoff -> assert -> ./internal/errors
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName === "./internal/errors" &&
    context.originModulePath.includes(path.join("assert", "build"))
  ) {
    const assertPkg = require.resolve("assert/package.json", {
      paths: [projectRoot, workspaceRoot],
    });
    return {
      filePath: path.join(path.dirname(assertPkg), "build", "internal", "errors.js"),
      type: "sourceFile",
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
