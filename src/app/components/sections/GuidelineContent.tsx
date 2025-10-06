"use client";
import { FC, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

interface GuidelineContentProps {
  isDarkMode: boolean;
}

interface GuidelineItem {
  question: string;
  steps: string[];
  images?: {
    pc?: string;
    mobile?: string;
  };
}

interface GuidelineSubsection {
  title: string;
  items: GuidelineItem[];
}

interface GuidelineSection {
  title: string;
  subsections: GuidelineSubsection[];
}

const GuidelineContent: FC<GuidelineContentProps> = ({ isDarkMode }) => {
  const [expandedSection, setExpandedSection] = useState<string | null>('leaderboard');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect if user is on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const guidelineData: GuidelineSection[] = [
    {
      title: "Leaderboard",
      subsections: [
        {
          title: "Filtering",
          items: [
            {
              question: "How to filter using the time range",
              steps: [
                "Step 1: Each leaderboard has a timeline bar at the top of the table or chart.",
                "Step 2: The tooltip shows the selected time range. Drag the handles to adjust the range. For example, you might select [Mar 2025, Aug 2025]."
              ],
              images: {
                pc: "/guidelines/timeline-filter-pc.png",
                mobile: "/guidelines/timeline-filter-mobile.png"
              }
            },
            {
              question: "What filters are available in the leaderboard?",
              steps: [
                "In table view, there is a timeline range bar (blue bar at the top) and a header bar for modality/dataset filters.",
                "Some leaderboards include checkboxes that let you filter by additional dimensions.",
                "In chart view, you can also switch the displayed metric by clicking the metric buttons."
              ],
              images: {
                pc: "/guidelines/filters-available-pc.png",
                mobile: "/guidelines/filters-available-mobile.png"
              }
            },
            {
              question: "How to apply additional filters",
              steps: [
                "Step 1: In certain leaderboards (Code Generation, Code Translation, Code Reasoning, Multi‑Modality), additional filters appear between the header filters and the results.",
                "Step 2: By default, no additional filters are applied (equivalent to selecting all options).",
                "Step 3: Use the checkboxes to narrow the results. For example, filter by dataset \"HackerRank\" and knowledge \"Data Structures\"."
              ],
              images: {
                pc: "/guidelines/additional-filters-pc.png",
                mobile: "/guidelines/additional-filters-mobile.png"
              }
            }
          ]
        },
        {
          title: "Chart View",
          items: [
            {
              question: "What is in the chart view",
              steps: [
                "The chart view shows model performance for a selected metric over the model release date.",
                "It includes the header filter bar (modality/dataset), any additional dimension filters, and the timeline range bar.",
                "Below the graph, the model results for the selected metric are listed."
              ],
              images: {
                pc: "/guidelines/chart-view-pc.png",
                mobile: "/guidelines/chart-view-mobile.png"
              }
            },
            {
              question: "How to see extra information in the graph",
              steps: [
                "Step 1: Hover over a data point to see the model name, release date, and exact metric value.",
                "Step 2: Zoom in or out using the green (zoom in) and orange (zoom out) buttons.",
                "Step 3 (PC only): After zooming in, you can:",
                "  • Dragging: Pan the view",
                "  • Ctrl+Drag: Select an area",
                "  • Double‑click: Reset"
              ],
              images: {
                pc: "/guidelines/chart-interactions-pc.png",
                mobile: "/guidelines/chart-interactions-mobile.png"
              }
            }
          ]
        },
        {
          title: "Table View",
          items: [
            {
              question: "How to adjust the table",
              steps: [
                "Step 1: Besides using filters, click a column header to sort ascending or descending (default: ascending by rank).",
                "Step 2: Click the Rank header to reset sorting.",
                "Step 3: Drag a header edge to increase or decrease the column width to focus on specific results.",
                "Step 4: Hover a header to see the full metric name.",
                "Step 5: Click a model name in the Model column to open that model's detail page.",
                "Step 6: Use the horizontal scrollbar under the table to view columns that are off‑screen."
              ],
              images: {
                pc: "/guidelines/table-adjust-pc.png",
                mobile: "/guidelines/table-adjust-mobile.png"
              }
            }
          ]
        },
        {
          title: "Compare",
          items: [
            {
              question: "How to open the compare section",
              steps: [
                "Click the \"Compare\" button under the title."
              ],
              images: {
                pc: "/guidelines/compare-open-pc.png",
                mobile: "/guidelines/compare-open-mobile.png"
              }
            },
            {
              question: "What is in the compare section",
              steps: [
                "The compare section visualizes the table results using bar or radar charts for a clearer, side‑by‑side comparison between models."
              ],
              images: {
                pc: "/guidelines/compare-section-pc.png",
                mobile: "/guidelines/compare-section-mobile.png"
              }
            },
            {
              question: "How to compare models",
              steps: [
                "Step 1: In the Select Models area, choose up to 5 models to compare.",
                "Step 2: The Performance Comparison chart updates to show the selected models.",
                "Step 3: Click a model name in the legend to temporarily hide or show it in the chart.",
                "Step 4: Hover to see detailed metric values.",
                "Notice: If filters are enabled, the compare section reflects them (e.g., it shows \"Modality: Python\" for the Python leaderboard)."
              ],
              images: {
                pc: "/guidelines/compare-models-pc.png",
                mobile: "/guidelines/compare-models-mobile.png"
              }
            }
          ]
        },
        {
          title: "Exporting",
          items: [
            {
              question: "How to export the results",
              steps: [
                "Click the green \"Export\" button under the title.",
                "In table view, a CSV file with the numerical data is exported.",
                "In chart view, the chart image is exported."
              ],
              images: {
                pc: "/guidelines/export-pc.png",
                mobile: "/guidelines/export-mobile.png"
              }
            }
          ]
        }
      ]
    },
    {
      title: "Additional",
      subsections: [
        {
          title: "Sidebar",
          items: [
            {
              question: "How to switch dark/light mode",
              steps: [
                "Step 1: On small screens, click the top‑right menu.",
                "Step 2: Click the Dark Mode button to toggle between dark and light modes."
              ],
              images: {
                pc: "/guidelines/dark-mode-pc.png",
                mobile: "/guidelines/dark-mode-mobile.png"
              }
            }
          ]
        }
      ]
    }
  ];

  const toggleSection = (sectionTitle: string) => {
    setExpandedSection(expandedSection === sectionTitle ? null : sectionTitle);
    setExpandedItem(null); // Reset expanded item when changing sections
  };

  const toggleItem = (itemKey: string) => {
    setExpandedItem(expandedItem === itemKey ? null : itemKey);
  };

  return (
    <section className="relative py-12 pb-20">
      <motion.div 
        className="max-w-6xl mx-auto px-4"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="space-y-6">
          {guidelineData.map((section, sectionIndex) => (
            <motion.div
              key={section.title}
              className={`rounded-xl overflow-hidden ${
                isDarkMode 
                  ? 'bg-[#0f1729]/80 border border-blue-500/20' 
                  : 'bg-white border border-slate-200'
              } shadow-lg`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: sectionIndex * 0.1 }}
            >
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.title)}
                className={`w-full px-8 py-6 flex items-center justify-between ${
                  isDarkMode 
                    ? 'bg-blue-900/20 hover:bg-blue-900/30' 
                    : 'bg-blue-50 hover:bg-blue-100'
                } transition-colors`}
              >
                <h2 className={`text-4xl font-bold ${
                  isDarkMode ? 'text-blue-300' : 'text-blue-700'
                }`}>
                  {section.title}
                </h2>
                {expandedSection === section.title ? (
                  <ChevronUpIcon className={`w-8 h-8 ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`} />
                ) : (
                  <ChevronDownIcon className={`w-8 h-8 ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`} />
                )}
              </button>

              {/* Section Content */}
              <AnimatePresence>
                {expandedSection === section.title && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="p-8 space-y-8">
                      {section.subsections.map((subsection, subsectionIndex) => (
                        <div key={subsectionIndex} className="space-y-4">
                          {/* Subsection Title */}
                          <h3 className={`text-3xl font-bold ${
                            isDarkMode ? 'text-white' : 'text-gray-800'
                          }`}>
                            {subsection.title}
                          </h3>

                          {/* Items */}
                          <div className="space-y-4">
                            {subsection.items.map((item, itemIndex) => {
                              const itemKey = `${section.title}-${subsectionIndex}-${itemIndex}`;
                              const isExpanded = expandedItem === itemKey;

                              return (
                                <div
                                  key={itemIndex}
                                  className={`rounded-lg overflow-hidden ${
                                    isDarkMode 
                                      ? 'bg-gray-800/50 border border-gray-700' 
                                      : 'bg-gray-50 border border-gray-200'
                                  }`}
                                >
                                  {/* Question Header */}
                                  <button
                                    onClick={() => toggleItem(itemKey)}
                                    className={`w-full px-6 py-4 flex items-center justify-between ${
                                      isDarkMode 
                                        ? 'hover:bg-gray-700/50' 
                                        : 'hover:bg-gray-100'
                                    } transition-colors`}
                                  >
                                    <h4 className={`text-xl font-semibold text-left ${
                                      isDarkMode ? 'text-blue-300' : 'text-blue-700'
                                    }`}>
                                      {item.question}
                                    </h4>
                                    {isExpanded ? (
                                      <ChevronUpIcon className={`w-6 h-6 flex-shrink-0 ml-4 ${
                                        isDarkMode ? 'text-blue-300' : 'text-blue-700'
                                      }`} />
                                    ) : (
                                      <ChevronDownIcon className={`w-6 h-6 flex-shrink-0 ml-4 ${
                                        isDarkMode ? 'text-blue-300' : 'text-blue-700'
                                      }`} />
                                    )}
                                  </button>

                                  {/* Answer Content */}
                                  <AnimatePresence>
                                    {isExpanded && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="overflow-hidden"
                                      >
                                        <div className="px-6 pb-6 space-y-6">
                                          {/* Steps */}
                                          <div className="space-y-3">
                                            {item.steps.map((step, stepIndex) => (
                                              <div key={stepIndex} className="flex items-start">
                                                <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 mr-3 ${
                                                  isDarkMode ? 'bg-blue-400' : 'bg-blue-600'
                                                }`} />
                                                <p className={`text-lg ${
                                                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                }`}>
                                                  {step}
                                                </p>
                                              </div>
                                            ))}
                                          </div>

                                          {/* Image */}
                                          {item.images && (
                                            <div className="mt-6">
                                              <div className={`rounded-lg overflow-hidden ${
                                                isDarkMode 
                                                  ? 'bg-gray-900/50 border border-gray-700' 
                                                  : 'bg-white border border-gray-300'
                                              } p-4`}>
                                                <div className="relative w-full" style={{ minHeight: '200px' }}>
                                                  <Image
                                                    src={isMobile && item.images.mobile ? item.images.mobile : item.images.pc || '/guidelines/placeholder.png'}
                                                    alt={`${item.question} - ${isMobile ? 'Mobile' : 'Desktop'} View`}
                                                    width={800}
                                                    height={450}
                                                    className="rounded-lg w-full h-auto"
                                                    onError={(e) => {
                                                      // Fallback to placeholder on error
                                                      const target = e.target as HTMLImageElement;
                                                      target.src = '/guidelines/placeholder.svg';
                                                    }}
                                                  />
                                                  <div className={`mt-2 text-center text-sm ${
                                                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                                  }`}>
                                                    {isMobile ? 'Mobile View' : 'Desktop View'}
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
};

export default GuidelineContent;

