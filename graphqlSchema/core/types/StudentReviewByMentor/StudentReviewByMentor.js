const StudentReviewByMentor = `
  type StudentReviewByMentor @model {
    reviewType: ReviewType!
    reviewText: String!
    topic: Topic @relation(name: "StudentReviewByMentorTopic", direction: "OneWay")
    course: Course @relation(name: "StudentReviewByMentorCourse", direction: "OneWay")
    user: User! @relation(name: "StudentReviewByMentorUser", direction: "OneWay")
    batch: Batch @relation(name: "BatchStudentReviewByMentor")
}`;

export default [StudentReviewByMentor];
