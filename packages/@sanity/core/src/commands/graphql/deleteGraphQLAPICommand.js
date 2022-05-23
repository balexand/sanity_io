import {dynamicRequire} from '@sanity/util/_internal'

const helpText = `
Options
--dataset <dataset> Delete GraphQL API for the given dataset
--tag <tag> Delete GraphQL API for the given tag (defaults to 'default')

Examples
sanity graphql undeploy
sanity graphql undeploy --dataset staging
sanity graphql undeploy --dataset staging --tag next
`

export default {
  name: 'undeploy',
  group: 'graphql',
  description: 'Remove a deployed GraphQL API',
  action: (...args) => {
    const {deleteGraphQLApi} = dynamicRequire(
      require.resolve('../../actions/graphql/deleteApiAction')
    )
    deleteGraphQLApi(...args)
  },
  helpText,
}
