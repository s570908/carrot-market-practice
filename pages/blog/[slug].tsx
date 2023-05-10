import { readdirSync } from "fs";
import { GetStaticPaths, GetStaticProps, NextPage } from "next";
import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse/lib";
import remarkHtml from "remark-html";
import Layout from "@components/Layout";

const Post: NextPage<{ post: string; title: string }> = ({ post, title }) => {
  return (
    <Layout title={title}>
      <div
        className="blog-post-content flex flex-col items-center space-y-2 pt-10"
        dangerouslySetInnerHTML={{ __html: post }}
      />
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = () => {
  const files = readdirSync("./posts").map((file) => {
    const [name, _] = file.split(".");
    return { params: { slug: name } };
  });
  console.log(files);
  return {
    paths: files,
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps = async (ctx) => {
  const {
    content,
    data: { title },
  } = matter.read(`./posts/${ctx.params?.slug}.md`);
  // makrdown -> html
  const { value } = await unified().use(remarkParse).use(remarkHtml).process(content);
  return {
    props: {
      title,
      post: value,
    },
  };
};

export default Post;
