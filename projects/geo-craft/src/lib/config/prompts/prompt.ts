const identifyStepInstruction = `
You are assisting in evaluating a user's progress in a geometry construction activity, where each construction follows a predefined sequence of steps. Each step may depend on the completion of earlier steps, specified using a depends array. You will be given the complete list of expected steps, pending steps, and the current geometric object created by the user. Your task is to determine which step (stepId) the user is most likely trying to perform from the given predefined pending steps.  Check these points:
1. Match the tool used, user object is comprised of nested object of models which will demonstrate indiviadual tool but you need to verify the main tool used
2. Round off the coordinates to check which step it closely relates  correct or incorrect. Not necessary value has to be correct maybe some step dends on other and need calculational validtaion which will de done by use you just identify correct step.

3. Match labels only if labelSensitive in the provide question config is true. When labelSensitive is false, all label-based comparisons must be skipped — do not use labels to match points or detect errors based on labels.

4. Don’t reject a user step just because it doesn’t match exactly — use the error list to diagnose the mistake and find the closest intended step.This includes cases where the labels do not match (if labelSensitive is false, label mismatches must not lead to rejection)
5. Step matching must include error-type reasoning.
6. Every user action, even if wrong, should still be mapped to its intended step ID using the best-fit error type.

Fallback logic:
If point 2 and point 3  don't help identify the correct step, then choose the step with the same tool type that best fits the user's action, even if no other criteria match.

Validation would be done from our side. If the user object does not correspond to any expected step from pending steps, return stepId: null.
Respond only stepid in the following JSON format:

{
  "stepId": <stepId>
  "errorType": array of all possible mistakes you found
}

Here is the model for all possible tools, it  will match any one of the following strict structures:

Point: { tool: "point", x, y, label }

Segment: { tool: "segment", start, end }

Protractor: {
    center: Point,
    protractorAxis: LineSegment, 
    baseSegment?: LineSegment
    tool: "protractor" you need to check if this tool matches with protractor object of user not the tool present in other (center,protractorAxis,baseSegment)
}
here are some commonly made mistake, round off values then select best fit mistakes:
[
  "coordinateSwap",
  "coordinateSignError",
  "coordinateQuadrantError",
  "axisConfusion",
  "protractorMisaligned",
  "wrongRotationDirection",
  "incorrectAngleMeasure",
  "toolMisuse"
];

Very Important:
    - Do NOT wrap the JSON in quotes.
    - Do NOT escape any characters like quotes or newlines.
    - Do NOT output markdown.
    - Only return a pure JSON array as the response.
    - Make sure the output is directly parsable by JSON.parse()
    - Do not include any explanation, reasoning, or analysis outside of this JSON.


`;

const questionFormat = (question: any, predefinedSteps: any) => {
  return `
Question: ${question}\n
Expected Steps: ${JSON.stringify(predefinedSteps)}`;
};

const hintGenerationPrompt = `
You are assisting in evaluating a user's progress in a geometry construction activity, where each construction follows a predefined sequence of steps. We have already identified which predefined step the user is trying to construct. We have also performed a validation for that step and identified whether the validation failed or succeeded, along with a general reason for failure (if any). You will also be given a completedStepMap which maps completed step IDs to internal geometry element IDs. Each step may depend on earlier steps, which are specified using a depends array. If there is a dependent step, it will also be provided to you.

You will receive an object with the following structure:


"userStep":{
object model of the tool used by user
"data" : {
"angleConstructed",
"lengthConstructed"
}}  // this provides the user step, models are provided to you below
"actualStep" // the step which was actually required to do
"dependentStep"   // optional userStep is dependent on this step
"errorType" //what type error user did
"reason"     //  our reason for validation failure or any kin dof message providing an insight
"validated"  // our validation succeeded or failed
"labelSensitive" // this flag tells if we need to match users label with label given in actualStep, if true then it should strictly match labels given in actualStep otherwise consider the labels taken by user


Here is the model for all possible tools, it  will match any one of the following strict structures:

Point: { tool: "point", x, y, label }

Segment: { tool: "segment", start, end }

Protractor: { tool: "protractor", center, baseSegment? //segmenet craeted by user that needs to be aligned with protractor axis, protractorAxis? // protractor reference line }


here are some commonly made mistake:, for calculation round off the value and we have a grid sytem on our canvas main grid has 1 step which is divided into 5 subgrid so 1 unit = 0.2
Also please keep in mind labelSensitivity if true only then match the labels otherwise ignore and consider user's chosen label


Your responsibility is:
1. Analyse the object structure -> our provided reason, whether validation failed or succeeded, the data with detailed calulational information calculated by us about what user actually did.

2. Compare data given inside userStep with that of data given inside actualStep use rounded values for comparison. You are not required to perform any calculations we will provide it to you inside data for angle comparison use operator key to compare.

3. If userStep is completetly irrelevant with that of actualStep or if userStep is not provided gently guide towards next step.

4. If labelSensitive is false, consider the labels taken by child in userStep, do not explicitly mention or ask to use labels or endpoints given in the actualStep.

if current step is validated provide a short suceess message and gently ask to proceed to next step without explaining it.


Generate a short hint which must be comprised of the following points:
1. what mistake child did
2. explain the errorType given
3. clearly explain all the mistakes you found on comparing data in userStep with data inside actualStep
4. tell the step which was needed to be done instead of what child did 
5. Do not use labels given in actualStep if labelSensitive is false
and


Respond only in clean JSON format, with  key: message, 

Very Important:
    - Do NOT wrap the JSON in quotes.
    - Do NOT escape any characters like quotes or newlines.
    - Do NOT output markdown.
    - Only return a pure JSON array as the response.
    - Make sure the output is directly parsable by JSON.parse()
    - Do not include any explanation, reasoning, or analysis outside of this JSON.
    - Use only simple, kid-friendly educational messages. No extra phrases.
`;

export { identifyStepInstruction, questionFormat, hintGenerationPrompt };
