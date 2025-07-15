<script setup lang="ts">
</script>
<template>
  <nav class="nav-bar">
    <router-link to="/demo1">Demo1</router-link>
    <router-link to="/demo2">Demo2</router-link>
    <router-link to="/demo3">Demo3</router-link>
    <router-link to="/demo4">Demo4</router-link>
    <router-link to="/demo5">Demo5</router-link>
  </nav>
  <router-view />
</template>
<style scoped>
.nav-bar {
  width: 100vw;
  height: 48px;
  background: #222;
  display: flex;
  align-items: center;
  gap: 24px;
  padding-left: 32px;
  position: absolute;
  top: 0;
  z-index: 1;
}
.nav-bar a {
  color: #fff;
  text-decoration: none;
  font-size: 1.1rem;
  padding: 6px 12px;
  border-radius: 4px;
  transition: background 0.2s;
}
.nav-bar a.router-link-active {
  background: #646cff;
}
</style>
