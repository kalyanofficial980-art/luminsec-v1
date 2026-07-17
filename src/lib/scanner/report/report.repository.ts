import { prisma } from "@/lib/db/prisma";
import { SecurityReport } from "./report.types";


export class ReportRepository {


    async save(
        report:SecurityReport
    ){


        return prisma.scanReport.create({

            data:{


                reportId:
                    report.reportId,


                targetUrl:
                    report.target.url,


                riskLevel:
                    report.summary.riskLevel,


                riskScore:
                    report.summary.riskScore,


                totalFindings:
                    report.findings.length,


                report:


                    report as any,


                findings:{


                    create:

                    report.findings.map(
                        finding => ({

                            title:
                                finding.title,


                            description:
                                finding.description,


                            severity:
                                finding.severity,


                            category:
                                finding.category,


                            evidence:
                                finding.evidence,


                            recommendation:
                                finding.recommendation

                        })
                    )

                }

            }

        });


    }


    async findById(
        reportId:string
    ){


        return prisma.scanReport.findUnique({

            where:{
                reportId
            },

            include:{
                findings:true
            }

        });

    }


}
