<template>
  <div>
    <textarea :value="markdown" cols="30" rows="10"></textarea>
    <!-- <div v-html="markdownToHtml"></div> -->
  </div>
</template>
<script>
import axios from "axios";
import marked from "marked";
export default {
  name: "MdView",
  data() {
    return {
      markdown: "",
    };
  },
  computed: {
    markdownToHtml() {
      return marked(this.markdown);
    },
  },
  mounted() {
    axios.get("../db/index.json").then((res) => {
      let data = res.data.index;
      console.log(data);
      data.map((value, index) => {
        // console.log("# " + value.name);
        this.markdown += value + "\n";
      });
    });
  },
};
</script>
<style>

</style>