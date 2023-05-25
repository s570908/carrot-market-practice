import { readdirSync } from "fs";
import { GetStaticPaths, GetStaticProps, NextPage } from "next";
import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkHtml from "remark-html";
import Layout from "@components/Layout";

const Post: NextPage<{ post: string; title: string }> = ({ post, title }) => {
  return (
    <Layout seoTitle={title} title={title} canGoBack backUrl="back">
      <div
        className="blog-post-content flex flex-col items-center space-y-2 pt-10"
        dangerouslySetInnerHTML={{ __html: post }}
      />
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = () => {
  const files = readdirSync("./posts").map((file) => {
    const [name, extension] = file.split(".");
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
  // https://www.daleseo.com/unified-remark-rehype/
  const { value } = await unified()
    .use(remarkParse) //  Markdown을 root를 최상위 노드로 갖는 계층적인 트리의 형태로 변환하는 library
    .use(remarkHtml) //  HTML 텍스트로 변환
    .process(content); //
  return {
    props: {
      title,
      post: value,
    },
  };
};

export default Post;
