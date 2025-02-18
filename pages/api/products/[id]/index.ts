import withHandler from "@libs/server/withHandler";
import { withApiSession } from "@libs/server/withSession";
import { NextApiRequest, NextApiResponse } from "next";
import client from "@libs/client/client";
import { Status } from "@prisma/client";
import axios, { AxiosError } from "axios";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") {
    console.log("POST /api/products/[id]: ", req.body);
    const {
      query: { id },
      body: { buyerId },
      session: { user },
    } = req;
    if (!id || !buyerId) {
      return res.status(404).end({ error: "request query, id or sellor, is not given." });
    }
    // 현재의 상태는 판매중이다. 예약한 사람이 없어야 한다.
    const reserveExist = await client.reservation.findFirst({
      where: {
        productId: Number(id),
      },
    });
    if (reserveExist) {
      return res.status(400).json({
        error: "Logical error: 얘약이 존재해서는 안된다. ",
      });
      // // 예약한 사람과 사려는 사람이 다른 경우에 에러 메세지가 나온다.
      // if (reserveExist.userId !== Number(buyerId)) {
      //   return res
      //     .status(404)
      //     .json({
      //       error: "buyer is not the reserved user. so you can't sell.",
      //     });
      // } else if (reserveExist.userId === Number(buyerId)) {
      //   // 예약한 사람에게 물건을 판매하는 경우 기존의 예약은 삭제하고 거래완료를 한다.
      //   await client.reservation.delete({
      //     where: {
      //       id: reserveExist.id,
      //     },
      //   });
      // } else {
      //   // Logical error: 예약한 사람과 사려는 사람이 동일하지 않은 경우
      //   return res.status(400).json({
      //     error: "Logical error: The reserved user and the buyer do not match.",
      //   });
      // }
    }
    // login user sells
    // 사려는 자에게 물건을 파는 경우 sale과 purchase를 만든다.
    const saleProduct = await client.sale.create({
      data: {
        user: {
          connect: {
            id: user?.id,
          },
        },
        product: {
          connect: {
            id: +id,
          },
        },
      },
    });

    // buyer purchases
    const purchaseProduct = await client.purchase.create({
      data: {
        user: {
          connect: {
            id: +buyerId,
          },
        },
        product: {
          connect: {
            id: +id,
          },
        },
      },
    });
    const updatedProduct = await client.product.update({
      where: {
        id: +id,
      },
      data: {
        status: Status.Sold, // this product has been sold.
      },
    });
    res.json({ ok: true, updatedProduct, purchaseProduct, saleProduct });
  }
  // if (req.method === "POST") {
  //   const {
  //     query: { id },
  //     body: { buyerId },
  //     session: { user },
  //   } = req;
  //   if (!id || !buyerId) {
  //     return res
  //       .status(404)
  //       .end({ error: "request query, id or sellor, is not given." });
  //   }
  //   const reserveExist = await client.reservation.findFirst({
  //     where: {
  //       productId: Number(id),
  //     },
  //   });
  //   if (reserveExist) {
  //     // 예약한 사람과 사려는 사람이 다른 경우에 에러 메세지가 나온다.
  //     if (reserveExist.userId !== Number(buyerId)) {
  //       return res
  //         .status(404)
  //         .json({
  //           error: "buyer is not the reserved user. so you can't sell.",
  //         });
  //     } else {
  //       // 예약한 사람에게 물건을 판매하는 경우 기존의 예약은 삭제하고 거래완료를 한다.
  //       await client.reservation.delete({
  //         where: {
  //           id: reserveExist.id,
  //         },
  //       });
  //     }
  //   }
  //   // login user sells
  //   // 사려는 자에게 물건을 파는 경우 sale과 purchase를 만든다.
  //   const saleProduct = await client.sale.create({
  //     data: {
  //       user: {
  //         connect: {
  //           id: user?.id,
  //         },
  //       },
  //       product: {
  //         connect: {
  //           id: +id,
  //         },
  //       },
  //     },
  //   });

  //   // buyer purchases
  //   const purchaseProduct = await client.purchase.create({
  //     data: {
  //       user: {
  //         connect: {
  //           id: +buyerId,
  //         },
  //       },
  //       product: {
  //         connect: {
  //           id: +id,
  //         },
  //       },
  //     },
  //   });
  //   await client.product.update({
  //     where: {
  //       id: +id,
  //     },
  //     data: {
  //       status: Status.Sold // this product has been sold. isSell is absurd and isSold is correct but I will leave unchanged
  //     },
  //   });

  //   const product = await client.product.findUnique({
  //     where: {
  //       id: +id,
  //     },
  //     select: {
  //       status: true
  //     },
  //     // user: {
  //     //   select: {
  //     //     id: true,
  //     //     name: true,
  //     //     avatar: true,
  //     //   },
  //     // },
  //     // productReviews: {
  //     //   select: {
  //     //     createdBy: {
  //     //       select: {
  //     //         name: true,
  //     //         avatar: true,
  //     //       },
  //     //     },
  //     //     review: true,
  //     //     score: true,
  //     //     createdAt: true,
  //     //   },
  //     // },
  //   });
  //   console.log("product.status: ", product?.status);

  //   res.json({ ok: true, purchaseProduct, saleProduct });
  // }
  if (req.method === "GET") {
    const user = req.session.user; // login user
    const {
      query: { id },
    } = req;
    // const page = req.query.page ? (req.query.page as String) : "";
    if (!id) {
      return res.status(404).json({ error: "request query is not given." });
    }
    const product = await client.product.findUnique({
      where: {
        id: +id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        productReviews: {
          select: {
            id: true,
            createdBy: {
              select: {
                name: true,
                avatar: true,
              },
            },
            review: true,
            score: true,
            createdAt: true,
          },
        },
        images: {
          // ProductImage 모델의 이미지 데이터 포함
          select: {
            id: true,
            imageId: true,
          },
        },
      },
    });

    /**
        product.name: "Samsung Galay40"
  
        ["Samsung", "Galay40"]
  
        [ {name: {contains: "Samsung" }}, 
          name: {contains: "Galay40" }}
        ]
  
        https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#or
    **/

    const terms = product?.name.split(" ").map((word) => ({
      name: { contains: word },
    }));

    const relatedProducts = await client.product.findMany({
      where: {
        OR: terms,
        AND: {
          id: {
            not: product?.id,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        images: {
          // ProductImage 모델의 이미지 데이터 포함
          select: {
            id: true,
            imageId: true,
          },
        },
      },
    });

    // login user인 내가 좋아요를 눌렀는지를 체크하여 이것을 reponse로 내보낸다: isLike
    // login user의 user.id, product는 product.id로 되어 있는 record를 fav 테이블에서 찾는다.
    // 있으면 내가 좋아요를 누른 것이다.
    const isLike = Boolean(
      await client.fav.findFirst({
        where: {
          userId: user?.id,
          productId: product?.id,
        },
        select: {
          id: true,
        },
      })
    );

    //console.log("product: ", product);
    //console.log("relatedProducts: ", relatedProducts);
    console.log("/api/products/[id] : id, isLike ", id, isLike);
    res.status(200).json({
      ok: true,
      isLike,
      product: product,
      relatedProducts: relatedProducts,
    });
  }
  if (req.method === "DELETE") {
    const {
      query: { id },
    } = req;

    if (!id) {
      return res.status(400).json({ error: "Product ID is required." });
    }

    try {
      // 1. 특정 제품 ID와 연결된 모든 이미지 정보 가져오기
      const productImages = await client.productImage.findMany({
        where: {
          productId: Number(id),
        },
        select: {
          imageId: true,
        },
      });

      // 2. 데이터베이스에서 제품 ID와 연결된 이미지 정보 삭제
      await client.productImage.deleteMany({
        where: {
          productId: Number(id),
        },
      });

      const deletedResults = await Promise.all(
        productImages.map(async (image) => {
          try {
            const response = await axios.delete(
              `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ID}/images/v1/${image.imageId}`,
              {
                headers: {
                  Authorization: `Bearer ${process.env.CF_IMAGE_TOKEN}`,
                },
              }
            );

            if (response.status === 200 && response.data.success) {
              return { imageId: image.imageId, success: true };
            } else {
              return {
                imageId: image.imageId,
                success: false,
                error: response.data.errors,
              };
            }
          } catch (error: any) {
            console.error(`Cloudflare 이미지 삭제 실패 (imageId: ${image.imageId}):`, error);
            if (error.response) {
              // 요청이 이루어졌으며 서버가 2xx의 범위를 벗어나는 상태 코드로 응답했습니다.
              console.error("response data:", error.response.data);
              console.error("response status:", error.response.status);
              console.error("response headers:", error.response.headers);
            } else if (error.request) {
              // 요청이 이루어 졌지만 응답을 받지 못했습니다.
              console.error("request:", error.request);
            } else {
              // 오류를 발생시킨 요청을 설정하는 중에 문제가 발생했습니다.
              console.error("error message:", error.message);
            }
            return {
              imageId: image.imageId,
              success: false,
              error: error.message,
            };
          }
        })
      );

      console.log("Cloudflare 이미지 삭제 결과:", deletedResults);

      res.status(200).json({
        ok: true,
        message: "Product and images deleted successfully.",
        deletedImages: deletedResults,
      });
    } catch (error) {
      console.error("Error deleting images:", error);
      res.status(500).json({ ok: false, error: "Failed to delete images." });
    }
  }
  if (req.method === "PUT") {
    const {
      query: { id },
      body,
    } = req;

    if (!id || !body) {
      return res.status(400).json({ error: "Product ID and update data are required." });
    }

    try {
      // 업데이트할 데이터 추출
      const { name, price, description, status, images, deletedImageIds } = body;

      // 1. 삭제된 이미지들을 Cloudflare에서 먼저 삭제
      // if (deletedImageIds && deletedImageIds.length > 0) {
      //   try {
      //     // 모든 이미지 삭제 요청을 동시에 처리
      //     await Promise.all(
      //       deletedImageIds.map((imageId: string) =>
      //         axios.delete(
      //           `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ID}/images/v1/${imageId}`,
      //           {
      //             headers: {
      //               Authorization: `Bearer ${process.env.CF_IMAGE_TOKEN}`,
      //             },
      //             timeout: 10000,
      //           }
      //         )
      //       )
      //     );
      //   } catch (error) {
      //     console.error("Cloudflare 이미지 삭제 실패:", error);
      //     return res.status(500).json({
      //       ok: false,
      //       error: "Failed to delete images from Cloudflare",
      //     });
      //   }
      // }

      // 2. Prisma 트랜잭션으로 상품 정보와 이미지 정보 동시 업데이트
      const updatedProduct = await client.$transaction(async (prisma) => {
        // 2-1. 기존 이미지 관계를 모두 삭제
        await prisma.productImage.deleteMany({
          where: {
            productId: +id,
          },
        });

        // 2-2. 새 이미지 추가 및 상품 정보 업데이트
        const product = await prisma.product.update({
          where: {
            id: +id,
          },
          data: {
            name,
            price: +price,
            description,
            images: {
              createMany: {
                // 새 이미지 배열을 이용하여 관계 생성
                data: images.map((image: { imageId: string }) => ({
                  imageId: image.imageId,
                })),
              },
            },
          },
          include: {
            images: true,
          },
        });

        // 2-3. 삭제된 이미지들을 Cloudflare에서 삭제
        if (deletedImageIds && deletedImageIds.length > 0) {
          try {
            // 모든 이미지 삭제 요청을 동시에 처리
            await Promise.all(
              deletedImageIds.map((imageId: string) =>
                axios.delete(
                  `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ID}/images/v1/${imageId}`,
                  {
                    headers: {
                      Authorization: `Bearer ${process.env.CF_IMAGE_TOKEN}`,
                    },
                    timeout: 10000,
                  }
                )
              )
            );
          } catch (error) {
            console.error("Cloudflare 이미지 삭제 실패:", error);
            return res.status(500).json({
              ok: false,
              error: "Failed to delete images from Cloudflare",
            });
          }
        }

        return product;
      });

      res.status(200).json({
        ok: true,
        message: "Product updated successfully.",
        product: updatedProduct,
      });
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({
        ok: false,
        error: "Failed to update product.",
      });
    }
  }
};

export default withApiSession(
  withHandler({ methods: ["GET", "POST", "PUT", "DELETE"], handler, isPrivate: true })
);
