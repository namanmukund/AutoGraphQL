const Testimonial = `
  type Testimonial @model {
    type: TestimonialType!
    authorType: AuthorType!
    authorName: String
    schoolName: String
    testimonial: String!
    displayPicture: File @relation(name: "TestimonialDisplayPicture", direction: "OneWay")
    video: File @relation(name: "TestimonialVideo", direction: "OneWay")
    status: ContentStatus! @defaultValue(value: "unpublished")
}`;

export default [Testimonial];
