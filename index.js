const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const consola = require('consola')

function findGitDirs(rootPath) {
  const gitDirs = [];
  const dirsToScan = [rootPath];

  while (dirsToScan.length) {
    const scanningDir = dirsToScan.shift();
    scanDir(scanningDir).forEach((dir) => {
      const dirPath = path.join(scanningDir, dir);
      if (isGitDir(dirPath)) {
        gitDirs.push(dirPath);
      } else {
        dirsToScan.push(dirPath);
      }
    });
  }

  return gitDirs;
}

function isGitDir(dirPath) {
  return fs.existsSync(path.join(dirPath, '.git'));
}

function scanDir(dirPath) {
  return fs.readdirSync(dirPath, { withFileTypes: true }).filter((dir) => {
    const stat = fs.statSync(path.join(dirPath, dir));
    return stat.isDirectory();
  });
}

function pullGitDir(gitDirPath) {
  const remotes = getGitRemotes(gitDirPath);
  const currentBranch = getCurrentBranch(gitDirPath);

  if (!remotes.length || remotes.indexOf('origin') === -1) {
    throw new Error('Error: no valid remote found');
  }

  if (currentBranch !== 'master') {
    throw new Error('Error: current branch is not master: ' + currentBranch);
  }

  if (remotes.indexOf('upstream') > -1) {
    return execSync(`git pull upstream ${currentBranch}`, { cwd: gitDirPath, stdio: 'inherit' });
  }

  return execSync(`git pull origin ${currentBranch}`, { cwd: gitDirPath, stdio: 'inherit' });
}

function getGitRemotes(gitDirPath) {
  const output = execSync(`git remote`, { cwd: gitDirPath }).toString();

  return output.split('\n').filter(Boolean);
}

function getCurrentBranch(gitDirPath) {
  return execSync(`git branch | cut -d ' ' -f2`, { cwd: gitDirPath }).toString().trim();
}

const BASE_PATHS = ['/home/lap12404/workspace/common', '/home/lap12404/workspace/mp3'];


function pull(basePath) {
  consola.info('Scanning git directories in path:', basePath);

  const gitDirs = findGitDirs(basePath);
  consola.success('Found:');

  gitDirs.forEach((dir) => {
    consola.log(dir);
  });

  consola.success('Start pulling:');

  gitDirs.forEach((dir) => {
    consola.success('Pulling', dir);
    try {
      pullGitDir(dir);
      consola.success('Done!',);
    } catch (err) {
      consola.error(`Failed (${err.status ? err.status : '-1'}):`, err.message);
    }
  });

}

BASE_PATHS.forEach(pull);
