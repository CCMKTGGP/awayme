import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    // Read the JSON file asynchronously
    const fileContents = {
      associatedApplications: [
        {
          applicationId: process.env.AZURE_AD_CLIENT_ID,
        },
      ],
    };

    // Return the file contents with the proper JSON header
    return new NextResponse(JSON.stringify(fileContents, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Return an error response if the file cannot be read
    return new NextResponse(
      JSON.stringify({ message: "Error loading JSON file", error }),
      { status: 500 }
    );
  }
}
