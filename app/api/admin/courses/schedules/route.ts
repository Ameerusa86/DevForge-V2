import "server-only";

import { NextResponse } from "next/server";

import { getCourseSchedules } from "@/lib/course-schedule";

export async function GET() {
  try {
    const schedules = await getCourseSchedules();
    return NextResponse.json({ schedules });
  } catch (error) {
    console.error("Error fetching course schedules:", error);
    return NextResponse.json(
      { error: "Failed to fetch course schedules" },
      { status: 500 },
    );
  }
}
