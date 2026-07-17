export interface RiskScore {

    score:number;

    grade:string;

    level:
        "low"
        |
        "medium"
        |
        "high"
        |
        "critical";

}
