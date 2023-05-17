import Layout from "@components/Layout";
import matter from "gray-matter";
import { readdirSync, readFileSync } from "fs";
import { GetStaticProps, NextPage } from "next";
import Link from "next/link";
import path from "path";

interface Post {
  title: string;
  date: string;
  category: string;
  place: string;
  slug: string;
}

const Blog: NextPage<{ posts: Post[] }> = ({ posts }) => {
  return (
    <Layout title="Blog" seoTitle="Blog">
      <h1 className="mb-10 mt-5 text-center text-xl font-semibold">Latest Posts:</h1>
      {posts.map((post, index) => (
        <div key={index} className="mb-5">
          <Link href={`/blog/${post.slug}`}>
            <a>
              <span className="text-lg text-red-500">{post.title}</span>
              <div>
                <span>
                  {post.date} / {post.category} / {post.place}
                </span>
              </div>
            </a>
          </Link>
        </div>
      ))}
    </Layout>
  );
};

export const getStaticProps: GetStaticProps = () => {
  const blogPosts = readdirSync("./posts").map((file) => {
    console.log("file: ", file);
    const content = readFileSync(`./posts/${file}`, "utf-8");
    const slug = file.split(".")[0];
    console.log("matter(content).data: ", matter(content).data, " slug: ", slug);
    return { ...matter(content).data, slug };
  });
  return {
    props: {
      posts: blogPosts.reverse(),
    },
  };
};

export default Blog;
