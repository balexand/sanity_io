# Sanity Block Tools

Various tools for processing Sanity block content. Mostly used internally in the Studio code, but it got some nice functions (especially `htmlToBlocks`) which is handy when you are importing data from HTML into your dataset as block text.

**NOTE:** To use `@sanity/block-tools` in a Node.js script, you will need to provide a `parseHtml` method - generally using `JSDOM`. [Read more](#jsdom-example).

## Example

Let's start with a complete example:

```js
import {Schema} from '@sanity/schema'
import {htmlToBlocks, getBlockContentFeatures} from '@sanity/block-tools'

// Start with compiling a schema we can work against
const defaultSchema = Schema.compile({
  name: 'myBlog',
  types: [
    {
      type: 'object',
      name: 'blogPost',
      fields: [
        {
          title: 'Title',
          type: 'string',
          name: 'title',
        },
        {
          title: 'Body',
          name: 'body',
          type: 'array',
          of: [{type: 'block'}],
        },
      ],
    },
  ],
})

// The compiled schema type for the content type that holds the block array
const blockContentType = defaultSchema
  .get('blogPost')
  .fields.find((field) => field.name === 'body').type

// Convert HTML to block array
const blocks = htmlToBlocks('<html><body><h1>Hello world!</h1><body></html>', blockContentType)
// Outputs
//
//  {
//    _type: 'block',
//    style: 'h1'
//    children: [
//      {
//        _type: 'span'
//        text: 'Hello world!'
//      }
//    ]
//  }

// Get the feature-set of a blockContentType
const features = getBlockContentFeatures(blockContentType)
```

## Methods

### `htmlToBlocks(html, blockContentType, options)` (html deserializer)

This will deserialize the input html (string) into blocks.

#### Params

##### `html`

The stringified version of the HTML you are importing

##### `blockContentType`

A compiled version of the block content schema type.

The deserializer will respect the schema when deserializing the HTML elements to blocks.

It only supports a subset of HTML tags. Any HTML tag not in the block-tools [whitelist](https://github.com/sanity-io/sanity/blob/243b4a5686a1293a8a977574a5cabc768ec01725/packages/%40sanity/block-tools/src/constants.ts#L24-L78) will be deserialized to normal blocks/spans.

For instance, if the schema doesn't allow H2 styles, all H2 HTML elements will be output like this:

```js
{
  _type: 'block',
  style: 'normal'
  children: [
    {
      _type: 'span'
      text: 'Hello world!'
    }
  ]
}
```

##### `options` (optional)

###### `parseHtml`

The HTML-deserialization is done by default by the browser's native DOMParser.
On the server side you can give the function `parseHtml`
that parses the html into a DOMParser compatible model / API.

###### JSDOM example

```js
const {JSDOM} = require('jsdom')
const {htmlToBlocks} = require('@sanity/block-tools')

const blocks = htmlToBlocks('<html><body><h1>Hello world!</h1><body></html>', blockContentType, {
  parseHtml: (html) => new JSDOM(html).window.document,
})
```

##### `rules`

You may add your own rules to deal with special HTML cases.

```js
htmlToBlocks(
  '<html><body><pre><code>const foo = "bar"</code></pre></body></html>',
  blockContentType,
  {
    parseHtml: (html) => new JSDOM(html),
    rules: [
      // Special rule for code blocks
      {
        deserialize(el, next, block) {
          if (el.tagName.toLowerCase() != 'pre') {
            return undefined
          }
          const code = el.children[0]
          const childNodes =
            code && code.tagName.toLowerCase() === 'code' ? code.childNodes : el.childNodes
          let text = ''
          childNodes.forEach((node) => {
            text += node.textContent
          })
          // Return this as an own block (via block helper function), instead of appending it to a default block's children
          return block({
            _type: 'code',
            language: 'javascript',
            text: text,
          })
        },
      },
    ],
  }
)
```

### `normalizeBlock(block, [options={}])`

Normalize a block object structure to make sure it has what it needs.

```js
import {normalizeBlock} from '@sanity/block-tools'
const partialBlock = {
  _type: 'block',
  children: [
    {
      _type: 'span',
      text: 'Foobar',
      marks: ['strong', 'df324e2qwe'],
    },
  ],
}
normalizeBlock(partialBlock, {allowedDecorators: ['strong']})
```

Will produce

```
{
  _key: 'randomKey0',
  _type: 'block',
  children: [
    {
      _key: 'randomKey00',
      _type: 'span',
      marks: ['strong'],
      text: 'Foobar'
    }
  ],
  markDefs: []
}
```

### `getBlockContentFeatures(blockContentType)`

Will return an object with the features enabled for the input block content type.

```js
{
  annotations: [{title: 'Link', value: 'link'}],
  decorators: [
    {title: 'Strong', value: 'strong'},
    {title: 'Emphasis', value: 'em'},
    {title: 'Code', value: 'code'},
    {title: 'Underline', value: 'underline'},
    {title: 'Strike', value: 'strike-through'}
  ],
  styles: [
    {title: 'Normal', value: 'normal'},
    {title: 'Heading 1', value: 'h1'},
    {title: 'H2', value: 'h2'},
    {title: 'H3', value: 'h3'},
    {title: 'H4', value: 'h4'},
    {title: 'H5', value: 'h5'},
    {title: 'H6', value: 'h6'},
    {title: 'Quote', value: 'blockquote'}
  ]
}
```
