"use client";
import { FC, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  TableCellsIcon,
  PresentationChartLineIcon,
  ArrowsPointingOutIcon,
  ArrowDownTrayIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';
import Image from 'next/image';

interface GuidelineContentProps {
  isDarkMode: boolean;
  onNavigateToTask?: (task: string) => void;
}

interface GuidelineItem {
  question: string;
  instructions: string[];
  images?: {
    pc?: string | string[];
    mobile?: string | string[];
    captions?: {
      pc?: string | string[];
      mobile?: string | string[];
    };
  };
  navigateToTask?: string;
}

interface GuidelineSubsection {
  title: string;
  items: GuidelineItem[];
}

interface GuidelineSection {
  title: string;
  icon?: JSX.Element;
  subsections: GuidelineSubsection[];
}

const GuidelineContent: FC<GuidelineContentProps> = ({ isDarkMode, onNavigateToTask }) => {
  // Navigation levels: 'sections' | 'subsections' | 'questions' | 'detail'
  const [currentLevel, setCurrentLevel] = useState<'sections' | 'subsections' | 'questions' | 'detail'>('sections');
  const [selectedSection, setSelectedSection] = useState<GuidelineSection | null>(null);
  const [selectedSubsection, setSelectedSubsection] = useState<GuidelineSubsection | null>(null);
  const [selectedItem, setSelectedItem] = useState<GuidelineItem | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Detect if user is on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const subsectionIcons: Record<string, JSX.Element> = {
    'Filtering': <ChartBarIcon className="w-8 h-8" />,
    'Chart View': <PresentationChartLineIcon className="w-8 h-8" />,
    'Table View': <TableCellsIcon className="w-8 h-8" />,
    'Compare': <ArrowsPointingOutIcon className="w-8 h-8" />,
    'Exporting': <ArrowDownTrayIcon className="w-8 h-8" />,
    'Sidebar': <Bars3Icon className="w-8 h-8" />,
  };

  const guidelineData: GuidelineSection[] = [
    {
      title: "Leaderboard",
      icon: <ChartBarIcon className="w-16 h-16" />,
      subsections: [
        {
          title: "Filtering",
          items: [
            {
              question: "How to filter using the time range",
              instructions: [
                "Each leaderboard has a timeline bar at the top of the table or chart.",
                "The tooltip shows the selected time range. Drag the handles to adjust the range. For example, you might select [Mar 2025, Aug 2025]."
              ],
              images: {
                pc: ["/guidelines/desktop/timeline-filter-pc-1.png", "/guidelines/desktop/timeline-filter-pc-2.png"],
                mobile: ["/guidelines/mobile/timeline-filter-mobile-1.png", "/guidelines/mobile/timeline-filter-mobile-2.png"],
                captions: {
                  pc: ["Timeline bar showing the full date range", "Dragging the handles to adjust the selected time range (Models from Dec 2024 to May 2025)"],
                  mobile: ["Timeline bar on mobile view", "Adjusting time range on mobile interface (Models from Dec 2024 to May 2025)"]
                }
              }
            },
            {
              question: "What filters are available in the leaderboard?",
              instructions: [
                "In table view, there is a timeline range bar (blue bar at the top) and a header bar for modality/dataset filters.",
                "Some leaderboards include checkboxes that let you filter by additional dimensions.",
                "In chart view, you can also switch the displayed metric by clicking the metric buttons."
              ],
              images: {
                pc: ["/guidelines/desktop/filters-available-pc-1.png", "/guidelines/desktop/filters-available-pc-2.png"],
                mobile: ["/guidelines/mobile/filters-available-mobile-1.png", "/guidelines/mobile/filters-available-mobile-2.png"],
                captions: {
                  pc: ["", "In here, user can select other metric graph result by clicking the buttons (e.g. Easy Pass@1)"],
                  mobile: ["", "In here, user can select other metric graph result by clicking the buttons (e.g. Easy Pass@1)"]
                }
              }
            },
            {
              question: "How to apply additional filters",
              instructions: [
                "In certain leaderboards (Code Generation, Code Translation, Code Reasoning, Multi‑Modality), additional filters appear between the header filters and the results.",
                "By default, no additional filters are applied (equivalent to selecting all options).",
                "Use the checkboxes to narrow the results. For example, filter by dataset \"HackerRank\" and knowledge \"Data Structures\"."
              ],
              images: {
                pc: ["/guidelines/desktop/additional-filters-pc-1.png", "/guidelines/desktop/additional-filters-pc-2.png"],
                mobile: ["/guidelines/mobile/additional-filters-mobile-1.png", "/guidelines/mobile/additional-filters-mobile-2.png"],
                captions: {
                  pc: ["In default, the table is showing all results", "In here, HackerRank and Algorithms results are shown"],
                  mobile: ["In default, the table is showing all results", "In here, HackerRank and Algorithms results are shown"]
                }
              },
            }
          ]
        },
        {
          title: "Chart View",
          items: [
            {
              question: "What is in the chart view",
              instructions: [
                "The chart view shows model performance for a selected metric over the model release date.",
                "It includes the header filter bar (modality/dataset), any additional dimension filters, and the timeline range bar.",
                "Below the graph, the model results for the selected metric are listed."
              ],
              images: {
                pc: "/guidelines/desktop/chart-view-pc.png",
                mobile: "/guidelines/mobile/chart-view-mobile.png"
              }
            },
            {
              question: "How to see extra information in the graph",
              instructions: [
                "Hover over a data point to see the model name, release date, and exact metric value.",
                "Zoom in or out using the green (zoom in) and orange (zoom out) buttons.",
                "After zooming in, you can:",
                "  • Dragging: Pan the view",
                "  • Ctrl+Drag: Select an area (PC only)",
                "  • Double‑click (PC only): Reset zoom"
              ],
              images: {
                pc: ["/guidelines/desktop/chart-interactions-pc-1.png", "/guidelines/desktop/chart-interactions-pc-2.png"],
                mobile: ["/guidelines/mobile/chart-interactions-mobile-1.png", "/guidelines/mobile/chart-interactions-mobile-2.png"],
                captions: {
                  pc: ["", "User can also click the 'Reset Zoom' (Red button) to reset the zoom effect"],
                  mobile: ["", "User can also click the 'Reset Zoom' (Red button) to reset the zoom effect"]
                }
              }
            }
          ]
        },
        {
          title: "Table View",
          items: [
            {
              question: "How to adjust the table",
              instructions: [
                "Besides using filters, click a column header to sort ascending or descending (default: ascending by rank).",
                "Click the Rank header to reset sorting.",
                "Drag a header edge to increase or decrease the column width to focus on specific results.",
                "Hover a header to see the full metric name.",
                "Click a model name in the Model column to open that model's detail page.",
                "Use the horizontal scrollbar under the table to view columns that are off‑screen."
              ],
              images: {
                pc: ["/guidelines/desktop/table-adjust-pc-1.png", "/guidelines/desktop/table-adjust-pc-2.png", "/guidelines/desktop/table-adjust-pc-3.png", "/guidelines/desktop/table-adjust-pc-4.png", "/guidelines/desktop/table-adjust-pc-5.png", "/guidelines/desktop/table-adjust-pc-6.png"],
                mobile: ["/guidelines/mobile/table-adjust-mobile-1.png", "/guidelines/mobile/table-adjust-mobile-2.png", "/guidelines/mobile/table-adjust-mobile-3.png", "/guidelines/mobile/table-adjust-mobile-4.png", "/guidelines/mobile/table-adjust-mobile-5.png"],
                captions: {
                  pc: ["", "Here showing ranking by sorting the models based on Easy Pass@1 metric descendingly", "User can increase or decrease the column width in the table", "It will show the detail name Easy Pass@1 metric when hovering it", "When clicking the model name, it will navigate to the model page", "If the table contains too much information, user can use the horizontal scrollbar at the bottom"],
                  mobile: ["", "Here showing ranking by sorting the models based on Accuracy metric descendingly", "User can increase or decrease the column width in the table", "When clicking the model name, it will navigate to the model page", "If the table contains too much information, user can use the touch and drag to scroll the table"]
                }
              }
            }
          ]
        },
        {
          title: "Compare",
          items: [
            {
              question: "How to open the compare section",
              instructions: [
                "Click the \"Compare\" button under the title."
              ],
              images: {
                pc: "/guidelines/desktop/compare-open-pc.png",
                mobile: "/guidelines/mobile/compare-open-mobile.png",
                captions: {
                  pc: ["Clicking the 'Compare' button (purple button) can go to the compare section"],
                  mobile: ["Clicking the 'Compare' button (purple button) can go to the compare section"]
                }
              }
            },
            {
              question: "What is in the compare section",
              instructions: [
                "The compare section visualizes the table results using bar or radar charts for a clearer, side‑by‑side comparison between models."
              ],
              images: {
                pc: "/guidelines/desktop/compare-section-pc.png",
                mobile: "/guidelines/mobile/compare-section-mobile.png"
              }
            },
            {
              question: "How to compare models",
              instructions: [
                "In the Select Models area, choose up to 5 models to compare.",
                "The Performance Comparison chart updates to show the selected models.",
                "Click a model name in the legend to temporarily hide or show it in the chart.",
                "Hover (Or touch in mobile view) to see detailed metric values.",
                "Notice: If filters are enabled, the compare section reflects them (e.g., it shows \"Modality: Python\" for the Python leaderboard)."
              ],
              images: {
                pc: ["/guidelines/desktop/compare-models-pc-1.png", "/guidelines/desktop/compare-models-pc-2.png", "/guidelines/desktop/compare-models-pc-3.png", "/guidelines/desktop/compare-models-pc-4.png"],
                mobile: ["/guidelines/mobile/compare-models-mobile-1.png", "/guidelines/mobile/compare-models-mobile-2.png", "/guidelines/mobile/compare-models-mobile-3.png", "/guidelines/mobile/compare-models-mobile-4.png"],
                captions: {
                  pc: ["Here is showing the comparison between 3 models", "Here is the result when 'Claude-3.7-Sonnet' (orange button) is hidden", "", "When user selected some filter outside, it will show the filter in the section as well"],
                  mobile: ["Here is showing the comparison between 3 models", "Here is the result when 'Claude-3.7-Sonnet' (orange button) is hidden", "", "When user selected some filter outside, it will show the filter in the section as well"]
                }
              }
            }
          ]
        },
        {
          title: "Exporting",
          items: [
            {
              question: "How to export the results",
              instructions: [
                "Click the green \"Export\" button under the title.",
                "In table view, a CSV file with the numerical data is exported.",
                "In chart view, the chart image is exported."
              ],
              images: {
                pc: "/guidelines/desktop/export-pc-1.png",
                mobile: "/guidelines/mobile/export-mobile-1.png"
              }
            }
          ]
        }
      ]
    },
    {
      title: "Additional",
      icon: <Cog6ToothIcon className="w-16 h-16" />,
      subsections: [
        {
          title: "Sidebar",
          items: [
            {
              question: "How to switch dark/light mode",
              instructions: [
                "On small screens, click the top‑right menu.",
                "Click the Dark Mode button to toggle between dark and light modes."
              ],
              images: {
                    pc: ["/guidelines/desktop/dark-mode-pc-1.png", "/guidelines/desktop/dark-mode-pc-2.png", "/guidelines/desktop/dark-mode-pc-3.png"],
                    mobile: ["/guidelines/mobile/dark-mode-mobile-1.png"],
                    captions: {
                      pc: ["The sidebar is always showing in the full screen", "In small screen, user need to click the top-right icon to first open the sidebar first", ""],
                      mobile: ["In mobile view, user need to click the top-right icon to open the sidebar first"]
                    }
                  }
                }
              ]
            },
            {
              title: "Navigation",
              items: [
                {
                  question: "How to navigate between different leaderboards",
                  instructions: [
                    "Use the sidebar on the left to access different sections. (For smaller screen or mobile version, user need to click the top-right icon to open the sidebar first)",
                    "Select the leaderboard task under the 'Tasks' section",
                    ]
                },
                {
                  question: "What do the different task types mean?",
                  instructions: [
                    "Code Generation: Evaluates models' ability to generate code from natural language descriptions",
                    "Code Translation: Tests translation between different programming languages",
                    "Code Summarization: Measures ability to create concise summaries of code functionality",
                    "Code Review: Assesses models' capability to identify issues and suggest improvements",
                    "Code Robustness: Tests resilience against various code perturbations and edge cases",
                    "Vulnerability Detection: Evaluates detection of security vulnerabilities in code",
                    "Multi-Modality: Tests understanding of code with visual elements like UI components"
                  ],
                  images: {
                    pc: "/guidelines/desktop/task-types-pc.png",
                    mobile: "/guidelines/mobile/task-types-mobile.png"
                  }
                }
              ]
            },
            {
              title: "Troubleshooting",
              items: [
                {
                  question: "What should I do if the leaderboard is not loading?",
                  instructions: [
                    "Check your internet connection and refresh the page.",
                    "Clear your browser cache and cookies.",
                    "Try using a different browser or incognito/private mode.",
                    "If the issue persists, the data might be temporarily unavailable."
                  ]
                },
                {
                  question: "Why are some models missing from the leaderboard?",
                  instructions: [
                    "Models may be missing due to:",
                    "Filters applied that exclude certain models",
                    "The model hasn't been evaluated on the selected task/dataset",
                    "You need to check the paper detail to find the evaluated model list for each task"
                  ],
            }
          ]
        },
        {
          title: "External Resources",
          items: [
            {
              question: "How to access other resources",
              instructions: [
                "You need to navigate to overview page (via sidebar). Then there are 3 buttons in the hero section. Inside:",
                "Code - Linking to the Github project page",
                "Data - Linking to the huggingface page storing the dataset"
              ],
              images: {
                pc: ["/guidelines/desktop/external-resources-pc-1.png", "/guidelines/desktop/external-resources-pc-2.png", "/guidelines/desktop/external-resources-pc-3.png"],
                mobile: ["/guidelines/mobile/external-resources-mobile-1.png",  "/guidelines/desktop/external-resources-pc-2.png", "/guidelines/desktop/external-resources-pc-3.png"],
                captions: {
                  pc: ["The 'Code' and the 'Data' buttons are in the overview page", "Here is the Github page after clicking the 'Code' button", "Here is the HuggingFace page after clicking the 'Dataset' button"],
                  mobile: ["The 'Code' and the 'Data' buttons are in the overview page", "Here is the Github page after clicking the 'Code' button", "Here is the HuggingFace page after clicking the 'Dataset' button"]
                }
              }
            }
          ]
        }
      ]
    }
  ];

  // Navigation handlers
  const handleSectionClick = (section: GuidelineSection) => {
    setSelectedSection(section);
    setCurrentLevel('subsections');
  };

  const handleSubsectionClick = (subsection: GuidelineSubsection) => {
    setSelectedSubsection(subsection);
    setCurrentLevel('questions');
  };

  const handleQuestionClick = (item: GuidelineItem) => {
    setSelectedItem(item);
    setCurrentLevel('detail');
    setCurrentImageIndex(0); // Reset image index when opening a new question
    // Navigation is now handled only by the button click, not when opening the question
  };

  const handleBack = () => {
    if (currentLevel === 'detail') {
      setSelectedItem(null);
      setCurrentLevel('questions');
    } else if (currentLevel === 'questions') {
      setSelectedSubsection(null);
      setCurrentLevel('subsections');
    } else if (currentLevel === 'subsections') {
      setSelectedSection(null);
      setCurrentLevel('sections');
    }
  };

  // Render different views based on current level
  const renderSections = () => (
    <div className="grid md:grid-cols-2 gap-6">
      {guidelineData.map((section, index) => (
        <motion.button
          key={section.title}
          onClick={() => handleSectionClick(section)}
          className={`p-12 rounded-xl text-center transition-all ${
            isDarkMode 
              ? 'bg-[#0f1729]/80 border-2 border-blue-500/20 hover:border-blue-500/50 hover:bg-blue-900/20' 
              : 'bg-white border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50'
          } shadow-lg`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className={`flex justify-center mb-6 ${
            isDarkMode ? 'text-blue-400' : 'text-blue-600'
          }`}>
            {section.icon}
          </div>
          <h2 className={`text-4xl font-bold ${
            isDarkMode ? 'text-blue-300' : 'text-blue-700'
          }`}>
            {section.title}
          </h2>
          <div className={`mt-4 flex items-center justify-center gap-2 text-xl ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            <span>Explore</span>
            <ChevronRightIcon className="w-6 h-6" />
          </div>
        </motion.button>
      ))}
    </div>
  );

  const renderSubsections = () => {
    if (!selectedSection) return null;

    return (
      <div className="space-y-6">
        {selectedSection.subsections.map((subsection, index) => (
          <motion.button
            key={index}
            onClick={() => handleSubsectionClick(subsection)}
            className={`w-full p-8 rounded-xl text-left transition-all flex items-center justify-between ${
              isDarkMode 
                ? 'bg-[#0f1729]/80 border-2 border-blue-500/20 hover:border-blue-500/50 hover:bg-blue-900/20' 
                : 'bg-white border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50'
            } shadow-lg`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <div className="flex items-center gap-6">
              <div className={`${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                {subsectionIcons[subsection.title] || <ChartBarIcon className="w-8 h-8" />}
              </div>
              <div>
                <h3 className={`text-3xl font-bold ${
                  isDarkMode ? 'text-white' : 'text-gray-800'
                }`}>
                  {subsection.title}
                </h3>
                <p className={`text-xl mt-2 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {subsection.items.length} guide{subsection.items.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <ChevronRightIcon className={`w-8 h-8 ${
              isDarkMode ? 'text-blue-400' : 'text-blue-600'
            }`} />
          </motion.button>
        ))}
      </div>
    );
  };

  const renderQuestions = () => {
    if (!selectedSubsection) return null;

    return (
      <div className="space-y-4">
        {selectedSubsection.items.map((item, index) => (
          <motion.button
            key={index}
            onClick={() => handleQuestionClick(item)}
            className={`w-full p-6 rounded-xl text-left transition-all flex items-center justify-between ${
              isDarkMode 
                ? 'bg-[#0f1729]/80 border border-blue-500/20 hover:border-blue-500/50 hover:bg-blue-900/20' 
                : 'bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50'
            } shadow-md`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <h4 className={`text-2xl font-semibold ${
              isDarkMode ? 'text-blue-300' : 'text-blue-700'
            }`}>
              {item.question}
            </h4>
            <ChevronRightIcon className={`w-6 h-6 flex-shrink-0 ml-4 ${
              isDarkMode ? 'text-blue-400' : 'text-blue-600'
            }`} />
          </motion.button>
        ))}
      </div>
    );
  };

  const renderDetail = () => {
    if (!selectedItem) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-8"
      >
        {/* Question Title */}
        <div className={`p-8 rounded-xl ${
          isDarkMode 
            ? 'bg-blue-900/20 border-2 border-blue-500/30' 
            : 'bg-blue-50 border-2 border-blue-300'
        }`}>
          <h3 className={`text-3xl font-bold ${
            isDarkMode ? 'text-blue-200' : 'text-blue-800'
          }`}>
            {selectedItem.question}
          </h3>
          {selectedItem.navigateToTask && (
            <div className="mt-4">
              <button
                onClick={() => selectedItem.navigateToTask && onNavigateToTask && onNavigateToTask(selectedItem.navigateToTask)}
                className={`px-6 py-3 rounded-lg font-semibold text-lg transition-all ${
                  isDarkMode 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                } shadow-lg hover:shadow-xl`}
              >
                View {selectedItem.navigateToTask.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} Leaderboard
              </button>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className={`p-8 rounded-xl ${
          isDarkMode 
            ? 'bg-[#0f1729]/80 border border-blue-500/20' 
            : 'bg-white border border-slate-200'
        } shadow-lg`}>
          <h4 className={`text-2xl font-bold mb-6 ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>
            Instructions
          </h4>
          <div className="space-y-4">
            {selectedItem.instructions.map((instruction, instructionIndex) => (
              <div key={instructionIndex} className="flex items-start gap-4">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  isDarkMode 
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                    : 'bg-blue-100 text-blue-700 border border-blue-300'
                }`}>
                  {instructionIndex + 1}
                </div>
                <p className={`text-xl pt-1 leading-relaxed ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-800'
                }`}>
                  {instruction}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Screenshots */}
        {selectedItem.images && (
          <div className={`p-8 rounded-xl ${
            isDarkMode 
              ? 'bg-[#0f1729]/80 border border-blue-500/20' 
              : 'bg-white border border-slate-200'
          } shadow-lg`}>
            <h4 className={`text-2xl font-bold mb-6 ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}>
              Screenshots
            </h4>
            <div className={`rounded-lg overflow-hidden ${
              isDarkMode 
                ? 'bg-gray-900/50 border border-gray-700' 
                : 'bg-white border border-gray-300'
            } p-4`}>
              {(() => {
                const deviceImages = isMobile && selectedItem.images.mobile ? selectedItem.images.mobile : selectedItem.images.pc;
                const imagesToShow = Array.isArray(deviceImages) ? deviceImages : [deviceImages].filter(Boolean);
                
                if (imagesToShow.length === 0) return null;
                
                return (
                  <div className="relative">
                    {/* Image Container */}
                    <div className="relative w-full" style={{ minHeight: '400px' }}>
                <Image
                        src={imagesToShow[currentImageIndex] || '/guidelines/placeholder.svg'}
                        alt={`${selectedItem.question} - ${isMobile ? 'Mobile' : 'Desktop'} View ${imagesToShow.length > 1 ? `(${currentImageIndex + 1}/${imagesToShow.length})` : ''}`}
                        width={1000}
                        height={600}
                        className="rounded-lg w-full h-auto max-w-full object-contain"
                        style={{ minHeight: '400px', maxHeight: '800px' }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/guidelines/placeholder.svg';
                  }}
                />
                      
                      {/* Navigation Arrows */}
                      {imagesToShow.length > 1 && (
                        <>
                          <button
                            onClick={() => setCurrentImageIndex(prev => prev > 0 ? prev - 1 : imagesToShow.length - 1)}
                            className={`absolute left-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full transition-all ${
                              isDarkMode 
                                ? 'bg-gray-800/80 text-white hover:bg-gray-700/90' 
                                : 'bg-white/80 text-gray-800 hover:bg-white/90'
                            } shadow-lg hover:shadow-xl`}
                            aria-label="Previous image"
                          >
                            <ChevronLeftIcon className="w-6 h-6" />
                          </button>
                          
                          <button
                            onClick={() => setCurrentImageIndex(prev => prev < imagesToShow.length - 1 ? prev + 1 : 0)}
                            className={`absolute right-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full transition-all ${
                              isDarkMode 
                                ? 'bg-gray-800/80 text-white hover:bg-gray-700/90' 
                                : 'bg-white/80 text-gray-800 hover:bg-white/90'
                            } shadow-lg hover:shadow-xl`}
                            aria-label="Next image"
                          >
                            <ChevronRightIcon className="w-6 h-6" />
                          </button>
                        </>
                      )}
                    </div>
                    
                    {/* Image Counter, Device Info, and Caption */}
                    <div className="mt-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <div className={`text-sm font-medium ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {isMobile ? 'Mobile View' : 'Desktop View'}
                        </div>
                        
                        {imagesToShow.length > 1 && (
                          <div className={`text-sm font-medium ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {currentImageIndex + 1} of {imagesToShow.length}
                          </div>
                        )}
                      </div>
                      
                      {/* Image Caption */}
                      {(() => {
                        const captions = selectedItem.images?.captions;
                        if (!captions) return null;
                        
                        const deviceCaptions = isMobile && captions.mobile ? captions.mobile : captions.pc;
                        const captionsToShow = Array.isArray(deviceCaptions) ? deviceCaptions : [deviceCaptions].filter(Boolean);
                        
                        if (captionsToShow.length === 0 || !captionsToShow[currentImageIndex]) return null;
                        
                        return (
                          <div className={`text-base italic text-center px-4 py-2 rounded-lg ${
                            isDarkMode 
                              ? 'bg-gray-800/50 text-gray-300 border border-gray-700' 
                              : 'bg-gray-50 text-gray-600 border border-gray-200'
                          }`}>
                            {captionsToShow[currentImageIndex]}
                          </div>
                        );
                      })()}
                    </div>
                    
                    {/* Dots Indicator */}
                    {imagesToShow.length > 1 && (
                      <div className="flex justify-center mt-4 space-x-2">
                        {imagesToShow.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`w-3 h-3 rounded-full transition-all ${
                              index === currentImageIndex
                                ? isDarkMode ? 'bg-blue-400' : 'bg-blue-600'
                                : isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                            }`}
                            aria-label={`Go to image ${index + 1}`}
                          />
                        ))}
                      </div>
                    )}
              </div>
                );
              })()}
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <section className="relative py-12 pb-20">
      <motion.div 
        className="max-w-6xl mx-auto px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* Back Button */}
        <AnimatePresence>
          {currentLevel !== 'sections' && (
            <motion.button
              onClick={handleBack}
              className={`mb-8 flex items-center gap-3 px-6 py-3 rounded-lg font-semibold text-lg transition-all ${
                isDarkMode 
                  ? 'bg-blue-900/30 text-blue-200 hover:bg-blue-900/50 border border-blue-500/30' 
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-300'
              }`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <ChevronLeftIcon className="w-6 h-6" />
              <span>Back</span>
            </motion.button>
          )}
        </AnimatePresence>


        {/* Content based on current level */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentLevel}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {currentLevel === 'sections' && renderSections()}
            {currentLevel === 'subsections' && renderSubsections()}
            {currentLevel === 'questions' && renderQuestions()}
            {currentLevel === 'detail' && renderDetail()}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </section>
  );
};

export default GuidelineContent;

