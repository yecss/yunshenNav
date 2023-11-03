<template>
  <div class="page-container">
    <router-view></router-view>
  </div>
</template>

<script setup></script>

<style lang="scss">
.page-container {
  background-color: rgba($color: #fff, $alpha: .9);
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  border-radius: 6px;
}
</style>
