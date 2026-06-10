---
title: News Update
description: Updates From Blog Articles
layout: layouts/blog.njk
pagination:
  data: collections.posts
  size: 2
  reverse: true
testdata:
  - item1
  - item2
  - item3
  - item4
show_ford_store: true
show_partner: true
show_motors: true
permalink: "blog/{% if pagination.pageNumber > 0 %}page-{{ pagination.pageNumber + 1 }}/{% endif %}index.html"
---
