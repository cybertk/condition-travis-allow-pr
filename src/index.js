const { unlinkSync } = require('fs')

const SRError = require('@semantic-release/error')

module.exports = function (pluginConfig, {env, options}, cb) {
  if (env.TRAVIS !== 'true') return cb(new SRError('Not running on Travis', 'ENOTRAVIS'))

  if (env.hasOwnProperty('TRAVIS_PULL_REQUEST') && env.TRAVIS_PULL_REQUEST !== 'false') return cb(new SRError('Not publishing from pull requests', 'EPULLREQUEST'))
  if (env.TRAVIS_TAG) return cb(new SRError('Not publishing from tags', 'EGITTAG'))

  if (options.branch !== env.TRAVIS_BRANCH) return cb(new SRError(`Branch is not ${options.branch}`, 'EBRANCHMISMATCH'))

  if (env.BUILD_MINION === 'YES') return cb(new SRError('Not publishing from minion', 'ENOBUILDLEADER'))

  if (env.BUILD_LEADER === 'YES') {
    if (env.BUILD_AGGREGATE_STATUS !== 'others_succeeded') return cb(new SRError('Not publishing when other jobs in the build matrix fail.', 'EOTHERSFAILED'))

    try { unlinkSync('./travis_after_all.py') } catch (e) {}
    try { unlinkSync('./.to_export_back') } catch (e) {}
  }

  cb(null)
}
