var travisAfterAll = require('travis-after-all')

var semver = require('semver')
var SRError = require('@semantic-release/error')

module.exports = function (pluginConfig, config, cb) {
  var env = config.env
  var options = config.options

  if (env.TRAVIS !== 'true') {
    return cb(new SRError(
      'semantic-release didn’t run on Travis CI and therefore a new version won’t be published.\n' +
      'You can customize this behavior using "verifyConditions" plugins: git.io/sr-plugins',
      'ENOTRAVIS'
    ))
  }

  if (pluginConfig.allowPR === false && env.hasOwnProperty('TRAVIS_PULL_REQUEST') && env.TRAVIS_PULL_REQUEST !== 'false') {
    return cb(new SRError(
      'This test run was triggered by a pull request and therefore a new version won’t be published.',
      'EPULLREQUEST'
    ))
  }

  if (env.TRAVIS_TAG) {
    var errorMessage = 'This test run was triggered by a git tag and therefore a new version won’t be published.'

    if (semver.valid(env.TRAVIS_TAG)) {
      errorMessage += '\nIt is very likely that this tag was created by semantic-release itself.\n' +
       'Everything is okay. For log output of the actual publishing process look at the build that ran before this one.'
    }

    return cb(new SRError(errorMessage, 'EGITTAG'))
  }

  if (options.branch !== env.TRAVIS_BRANCH) {
    return cb(new SRError(
      'This test run was triggered on the branch ' + env.TRAVIS_BRANCH +
      ', while semantic-release is configured to only publish from ' +
      options.branch + '.\n' +
      'You can customize this behavior using the "branch" option: git.io/sr-options',
      'EBRANCHMISMATCH'
    ))
  }

  travisAfterAll(function (code, err) {
    if (code === 0) return cb(null)

    if (code === 1) {
      return cb(new SRError(
        'In this test run not all jobs passed and therefore a new version won’t be published.',
        'EOTHERSFAILED'
      ))
    }

    if (code === 2) {
      return cb(new SRError(
        'This test run is not the build leader and therefore a new version won’t be published.',
        'ENOBUILDLEADER'
      ))
    }

    cb(err || new SRError('travis-after-all returned unexpected error code', 'ETAAFAIL'))
  })
}
