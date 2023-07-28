---
title: Edit translations with inlang's web editor
shortTitle: Web Editor
href: /documentation/apps/web-editor
description: inlang's web editor is a simple and easy to use no-code tool to manage your translations.
---

# {% $frontmatter.shortTitle %}

The inlang web editor is a simple and easy to use no-code tool to manage your translations. It let's translators work on translations without having to touch the code and pushes changes directly to your git repository.

### Benefits

- ✅ Works with existing translation files
- 🔀 Git workflows, like pull requests
- 🚫 No hosting, no sync pipelines
- 🙅‍♂️ No extra accounts

## Setup

You can use the editor with any git repository. The only requirement is that you have a `inlang.config.js` file in the root of your repository. To get started, follow the steps in the [quick start guide](/documentation/quick-start).

**Required:**
A plugin to read and write your translation files. To find the correct plugin for your project, check out the [plugin registry](/documentation/plugins/registry).

**Recommended:**
A plugin to enable linting feature for your translation files. For example, you can use the [@inlang/plugin-standard-lint-rules](https://github.com/inlang/inlang/tree/main/source-code/plugins/standard-lint-rules) plugin.

{% QuickLinks %}

    {% QuickLink
        title="Setup your config now"
        icon="fast"
        href="/documentation/quick-start"
        description="Setup inlang for a localized project."
    /%}

{% /QuickLinks %}

## How to use

1. Go to the [Editor](https://inlang.com/editor)
2. Paste your repository URL
3. Login in with your GitHub account
4. Fork the repository
5. Make translations
6. Push changes to your forked repository
7. Create a pull request

**Note:** If you have write access, you can skip the forking step and push directly to the repository.

## Linkability

In order to reference specific messages within the editor, it is possible to utilize `searchParams` to apply particular filters. You can stack these parameters behind each other.

Example: `https://inlang.com/editor/github.com/orga/project?search='common'&lint='missingMessage'`

- **🆔 id**

  `?id='myId'` The id parameter links to only one specific message. Make sure to provide the correct id, as only one message will be displayed. If the id is incorrect, no message will be shown. The parameter should be provided only once.

- **🔎 search**

  `?search='mySearch'` The search parameter filters messages by search string. The parameter should be provided only once.

- **🚨 lint**

  `?lint='missingMessage&lint=messageWithoutReference'` The lint parameter filters the messages by lint rule. The parameter could be provided multiple times.

- **🌎 lang**

  `?lang='en'&lang='de'` The lang parameter filters the messages by languages. The parameter could be provided multiple times.
