# ReadMe
## Intro
Press Alt+3 and get your markdown link in clipboard

## More Intro
### Markdown Link
a markdown link looks like `[description](link)`

description is divided into two part, 
prefix, suffix

#### Description
##### Description Prefix
prefix, 
if no text is selected, in most cases, the first `<h1>` element is selected as prefix, 
if any text is selected, the text is selected as prefix

##### Description Suffix
suffix, 
for example, 
`prefix - Github` , 
suffix is recognized by domain, 
rules are recorded in `data.json` , 
if the domain hit a rule, then append suffix, else NOT, 
to add rule, edit `data.json`

#### Link
link, 
sometimes the extension will trim link to a shorter link, remove parameters

### NOT available on HTTP
HTTP is considered unsafe, so that clipboard API is disabled
