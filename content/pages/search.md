---
title: Search
description: Search article here..
layout: layouts/page.njk
permalink: /search/
---

<link href="/_pagefind/pagefind-ui.css" rel="stylesheet">
<script src="/_pagefind/pagefind-ui.js"></script>
<div id="search"></div>
<script>
    new PagefindUI({ element: "#search", showSubResults: true });
</script>