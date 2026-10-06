---
layout: default
---
<div class="home">
  <h2 class="post-list-heading">Articles</h2>
  <ul class="post-list">
    {%- assign articles = site.pages | where_exp: "p", "p.path contains 'articles/'" | sort: "date" | reverse -%}
    {%- for article in articles -%}
    <li>
      <span class="post-meta">{{ article.date | date: "%b %-d, %Y" }}</span>
      <h3><a class="post-link" href="{{ article.url | relative_url }}">{{ article.title | escape }}</a></h3>
    </li>
    {%- endfor -%}
  </ul>
</div>
