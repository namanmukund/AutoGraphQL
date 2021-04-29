const Testimonial = `
  type Testimonial @model {
    author: AuthorType!
    type: TestimonialType!
    parentName: String
    studentName: String
    principalName: String
    schoolName: String
    testimonial: String!
    displayPic: File @relation(name: "TestimonialDisplayPic", direction: "OneWay", isSubset: true)
    videoUrl: File @relation(name: "TestimonialVideoUrl", direction: "OneWay", isSubset: true)
}`;

export default [Testimonial];
