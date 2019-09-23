# CSS Grid component

This is a simple CSS Grid implementation with a rough IE 11 interpretation. This grid supports 1 - 4 column layouts with basic gap controls.

Column breakpoints can be stacked:

```
<css-grid columns="2 4">
    ...snip...
</css-grid>
```

In the example above the columns will start in the default single column layout, then at the medium breakpoint it will switch to the 2 column layout, and eventually it will end in the 4 column layout at the extra large breakpoint.
