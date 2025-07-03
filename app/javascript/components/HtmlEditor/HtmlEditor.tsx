/**
 * This configuration was generated using the CKEditor 5 Builder. You can modify it anytime using this link:
 * https://ckeditor.com/ckeditor-5/builder/?redirect=portal#installation/NoBgNARATAdAbDAjBSiDsAOEAWAzLgTkQLjhBIFYoo48yK0Q5FcREMNdMNjcpsUEAKYA7FLjDBEYaeGmyAupADGy/BWUUICoA===
 */

import {useEffect, useMemo, useRef, useState} from 'react';
import {Document, User} from "../../types";
import {CKEditor, useCKEditorCloud} from '@ckeditor/ckeditor5-react';

import './HtmlEditor.css';
import InlineCommentsApi from "../../api/InlineCommentsApi.js";
import queryClient from "../../contextes/ReactQueryClient.tsx";
import UsersApi from "../../api/UsersApi";

/**
 * USE THIS INTEGRATION METHOD ONLY FOR DEVELOPMENT PURPOSES.
 *
 * This sample is configured to use OpenAI API for handling AI Assistant queries.
 * See: https://ckeditor.com/docs/ckeditor5/latest/features/ai-assistant/ai-assistant-integration.html
 * for a full integration and customization guide.
 */
const AI_API_KEY = '<YOUR_AI_API_KEY>';

const CLOUD_SERVICES_TOKEN_URL =
  'https://4iwzgvk92_bk.cke-cs.com/token/dev/53b5ba350283e49152660bde31b620df739a4dddc3f2dbc11772a89f5090?limit=10';
const CLOUD_SERVICES_WEBSOCKET_URL = 'wss://4iwzgvk92_bk.cke-cs.com/ws';

const HtmlEditor = ({initialData, document, currentUser, disabled = false}: HtmlEditorProps) => {
  const editorContainerRef = useRef(null);
  const editorMenuBarRef = useRef(null);
  const editorToolbarRef = useRef(null);
  const editorRef = useRef(null);
  const editorAnnotationsRef = useRef(null);
  const editorMinimapRef = useRef(null);
  const editorRevisionHistoryRef = useRef(null);
  const editorRevisionHistoryEditorRef = useRef(null);
  const editorRevisionHistorySidebarRef = useRef(null);
  const [isLayoutReady, setIsLayoutReady] = useState(false);
  const cloud = useCKEditorCloud({ version: '45.2.0', premium: true, ckbox: { version: '2.6.1' } });

  useEffect(() => {
    setIsLayoutReady(true);

    return () => setIsLayoutReady(false);
  }, []);

  const { DecoupledEditor, editorConfig } = useMemo(() => {
    if (cloud.status !== 'success' || !isLayoutReady) {
      return {};
    }

    const {
      DecoupledEditor,
      Plugin,
      ButtonView,
      Alignment,
      Autoformat,
      AutoImage,
      AutoLink,
      Autosave,
      BalloonToolbar,
      BlockQuote,
      BlockToolbar,
      Bold,
      CKBox,
      CKBoxImageEdit,
      CloudServices,
      Code,
      CodeBlock,
      Emoji,
      Essentials,
      FindAndReplace,
      FontBackgroundColor,
      FontColor,
      FontFamily,
      FontSize,
      Fullscreen,
      Heading,
      Highlight,
      HorizontalLine,
      ImageBlock,
      ImageCaption,
      ImageEditing,
      ImageInline,
      ImageInsert,
      ImageInsertViaUrl,
      ImageResize,
      ImageStyle,
      ImageTextAlternative,
      ImageToolbar,
      ImageUpload,
      ImageUtils,
      Indent,
      IndentBlock,
      Italic,
      Link,
      LinkImage,
      List,
      ListProperties,
      Mention,
      Minimap,
      PageBreak,
      Paragraph,
      PasteFromOffice,
      PictureEditing,
      RemoveFormat,
      SpecialCharacters,
      SpecialCharactersArrows,
      SpecialCharactersCurrency,
      SpecialCharactersEssentials,
      SpecialCharactersLatin,
      SpecialCharactersMathematical,
      SpecialCharactersText,
      Strikethrough,
      Subscript,
      Superscript,
      Table,
      TableCaption,
      TableCellProperties,
      TableColumnResize,
      TableLayout,
      TableProperties,
      TableToolbar,
      TextTransformation,
      TodoList,
      Underline
    } = cloud.CKEditor;
    const {
      CaseChange,
      Comments,
      ExportPdf,
      ExportWord,
      FormatPainter,
      ImportWord,
      MergeFields,
      MultiLevelList,
      Pagination,
      PasteFromOfficeEnhanced,
      RevisionHistory,
      SlashCommand,
      Template,
      TrackChanges,
      TrackChangesData,
      TrackChangesPreview
    } = cloud.CKEditorPremiumFeatures;

    /**
     * The `UsersIntegration` lets you manage user data and permissions.
     *
     * This is an essential feature when many users work on the same document.
     *
     * To read more about it, visit the CKEditor 5 documentation: https://ckeditor.com/docs/ckeditor5/latest/features/collaboration/users.html.
     */
    class UsersIntegration extends Plugin {
      static get requires() {
        return ['Users'];
      }

      static get pluginName() {
        return 'UsersIntegration';
      }

      init() {
        const usersPlugin = this.editor.plugins.get('Users');

        usersPlugin.addUser({
          id: currentUser.id.toString(), //CKEditor requires author ids to be strings
          name: currentUser.firstName + " " + currentUser.lastName,
        });

        usersPlugin.defineMe(currentUser.id.toString());

        // These are sample users for demonstration purposes.
        // In your integration make sure to provide user data from your data source.
        // const users = [
        //   { id: 'user-1', name: 'Zee Croce' },
        //   { id: 'user-2', name: 'Mex Haddox' }
        // ];
        // const me = users[0];
        //
        // for (const user of users) {
        //   usersPlugin.addUser(user);
        // }
        //
        // usersPlugin.defineMe(me.id);
      }
    }

    /**
     * The `CommentsIntegration` lets you synchronize comments in the document with your data source (e.g. a database).
     *
     * To read more about it, visit the CKEditor 5 documentation: https://ckeditor.com/docs/ckeditor5/latest/features/collaboration/comments/comments-integration.html.
     */
    class CommentsIntegration extends Plugin {
      static get requires() {
        return [ 'CommentsRepository', 'UsersIntegration' ];
      }

      static get pluginName() {
        return 'CommentsIntegration';
      }

      init() {
        const commentsRepositoryPlugin = this.editor.plugins.get( 'CommentsRepository' );

        // Set the adapter on the `CommentsRepository#adapter` property.
        commentsRepositoryPlugin.adapter = {
          addComment: async ({threadId, commentId, content, ...restOfData}) => {
            console.log('Comment added', restOfData);

            return await InlineCommentsApi.addComment({
              data: {
                documentId: document.id,
                threadId: threadId,
                commentId,
                content,
              }
            });
          },

          updateComment: async ({threadId, commentId, content, ...restOfData}) => {
            console.log('Comment updated', restOfData);

            return await InlineCommentsApi.updateComment({
              params: {
                threadId,
                commentId,
              },
              data: {
                content
              }
            })

            // Write a request to your database here. The returned `Promise`
            // should be resolved when the request has finished.
            return Promise.resolve();
          },

          removeComment( data ) {
            console.log( 'Comment removed', data );

            // Write a request to your database here. The returned `Promise`
            // should be resolved when the request has finished.
            return Promise.resolve();
          },

          addCommentThread: async ({threadId, comments, ...restOfData}) => {
            console.log( 'Comment thread added', restOfData);

            return await InlineCommentsApi.addCommentThread({
              data: {
                documentId: document.id,
                threadId,
                comments,
              }
            });
          },

          getCommentThread: async ({threadId, ...restOfData}) => {
            console.log('Getting comment thread', restOfData);

            const response = await InlineCommentsApi.getCommentThread({
              threadId,
            });

            const usersPlugin = this.editor.plugins.get("Users");

            const missingUsersIds = [...new Set(response.comments.map(comment => comment.authorId).filter(authorId => usersPlugin.getUser(authorId) === null))];

            for (const missingUserId of missingUsersIds) {
              const user = await queryClient.ensureQueryData({
                queryKey: ["users", parseInt(missingUsersIds[0])],
                queryFn: async () => {
                  // could be extracted to a separate, global file:
                  return await UsersApi.show({id: missingUsersIds[0]});
                }
              })
              usersPlugin.addUser({
                id: missingUserId,
                name: user.firstName + " " + user.lastName,
              });
            }

            return response;
          },

          updateCommentThread( data ) {
            console.log( 'Comment thread updated', data );

            // Write a request to your database here. The returned `Promise`
            // should be resolved when the request has finished.
            return Promise.resolve();
          },

          resolveCommentThread( data ) {
            console.log( 'Comment thread resolved', data );

            // Write a request to your database here. The returned `Promise`
            // should be resolved when the request has finished.
            return Promise.resolve( {
              resolvedAt: new Date(), // Should be set on the server side.
              resolvedBy: usersPlugin.me.id // Should be set on the server side.
            } );
          },

          reopenCommentThread( data ) {
            console.log( 'Comment thread reopened', data );

            // Write a request to your database here. The returned `Promise`
            // should be resolved when the request has finished.
            return Promise.resolve();
          },

          removeCommentThread( data ) {
            console.log( 'Comment thread removed', data );

            // Write a request to your database here. The returned `Promise`
            // should be resolved when the request has finished.
            return Promise.resolve();
          }

        };
      }
    }

    /**
     * The `TrackChangesIntegration` lets you synchronize suggestions added to the document with your data source (e.g. a database).
     *
     * To read more about it, visit the CKEditor 5 documentation: https://ckeditor.com/docs/ckeditor5/latest/features/collaboration/track-changes/track-changes-integration.html.
     */
    class TrackChangesIntegration extends Plugin {}

    /**
     * The `RevisionHistoryIntegration` lets you synchronize named revisions in the document with your data source (e.g. a database).
     *
     * To read more about it, visit the CKEditor 5 documentation: https://ckeditor.com/docs/ckeditor5/latest/features/collaboration/revision-history/revision-history-integration.html.
     */
    class RevisionHistoryIntegration extends Plugin {}

    return {
      DecoupledEditor,
      editorConfig: {
        toolbar: {
          items: [
            'undo',
            'redo',
            '|',
            'previousPage',
            'nextPage',
            '|',
            'revisionHistory',
            'trackChanges',
            'comment',
            '|',
            'insertMergeField',
            'previewMergeFields',
            '|',
            'formatPainter',
            '|',
            'heading',
            '|',
            'fontSize',
            'fontFamily',
            'fontColor',
            'fontBackgroundColor',
            '|',
            'bold',
            'italic',
            'underline',
            '|',
            'link',
            'insertImage',
            'insertTable',
            'insertTableLayout',
            'highlight',
            'blockQuote',
            'codeBlock',
            '|',
            'alignment',
            '|',
            'bulletedList',
            'numberedList',
            'multiLevelList',
            'todoList',
            'outdent',
            'indent'
          ],
          shouldNotGroupWhenFull: false
        },
        plugins: [
          Alignment,
          Autoformat,
          AutoImage,
          AutoLink,
          Autosave,
          BalloonToolbar,
          BlockQuote,
          BlockToolbar,
          Bold,
          CaseChange,
          CKBox,
          CKBoxImageEdit,
          CloudServices,
          Code,
          CodeBlock,
          Comments,
          Emoji,
          Essentials,
          ExportPdf,
          ExportWord,
          FindAndReplace,
          FontBackgroundColor,
          FontColor,
          FontFamily,
          FontSize,
          FormatPainter,
          Fullscreen,
          Heading,
          Highlight,
          HorizontalLine,
          ImageBlock,
          ImageCaption,
          ImageEditing,
          ImageInline,
          ImageInsert,
          ImageInsertViaUrl,
          ImageResize,
          ImageStyle,
          ImageTextAlternative,
          ImageToolbar,
          ImageUpload,
          ImageUtils,
          ImportWord,
          Indent,
          IndentBlock,
          Italic,
          Link,
          LinkImage,
          List,
          ListProperties,
          Mention,
          MergeFields,
          Minimap,
          MultiLevelList,
          PageBreak,
          Pagination,
          Paragraph,
          PasteFromOffice,
          PasteFromOfficeEnhanced,
          PictureEditing,
          RemoveFormat,
          RevisionHistory,
          SlashCommand,
          SpecialCharacters,
          SpecialCharactersArrows,
          SpecialCharactersCurrency,
          SpecialCharactersEssentials,
          SpecialCharactersLatin,
          SpecialCharactersMathematical,
          SpecialCharactersText,
          Strikethrough,
          Subscript,
          Superscript,
          Table,
          TableCaption,
          TableCellProperties,
          TableColumnResize,
          TableLayout,
          TableProperties,
          TableToolbar,
          Template,
          TextTransformation,
          TodoList,
          TrackChanges,
          TrackChangesData,
          TrackChangesPreview,
          Underline
        ],
        extraPlugins: [UsersIntegration, CommentsIntegration, TrackChangesIntegration, RevisionHistoryIntegration],
        balloonToolbar: ['comment', '|', 'bold', 'italic', '|', 'link', 'insertImage', '|', 'bulletedList', 'numberedList'],
        blockToolbar: [
          'comment',
          '|',
          'fontSize',
          'fontColor',
          'fontBackgroundColor',
          '|',
          'bold',
          'italic',
          '|',
          'link',
          'insertImage',
          'insertTable',
          'insertTableLayout',
          '|',
          'bulletedList',
          'numberedList',
          'outdent',
          'indent'
        ],
        cloudServices: {
          tokenUrl: CLOUD_SERVICES_TOKEN_URL
        },
        comments: {
          editorConfig: {
            extraPlugins: [Autoformat, Bold, Italic, List, Mention],
            mention: {
              feeds: [
                {
                  marker: '@',
                  feed: [
                    /* See: https://ckeditor.com/docs/ckeditor5/latest/features/mentions.html#comments-with-mentions */
                  ]
                }
              ]
            }
          }
        },
        exportPdf: {
          stylesheets: [
            /* This path should point to the content stylesheets on your assets server. */
            /* See: https://ckeditor.com/docs/ckeditor5/latest/features/converters/export-pdf.html */
            './export-style.css',
            /* Export PDF needs access to stylesheets that style the content. */
            'https://cdn.ckeditor.com/ckeditor5/45.2.0/ckeditor5.css',
            'https://cdn.ckeditor.com/ckeditor5-premium-features/45.2.0/ckeditor5-premium-features.css'
          ],
          fileName: 'export-pdf-demo.pdf',
          converterOptions: {
            format: 'A4',
            margin_top: '20mm',
            margin_bottom: '20mm',
            margin_right: '12mm',
            margin_left: '12mm',
            page_orientation: 'portrait'
          }
        },
        exportWord: {
          stylesheets: [
            /* This path should point to the content stylesheets on your assets server. */
            /* See: https://ckeditor.com/docs/ckeditor5/latest/features/converters/export-word.html */
            './export-style.css',
            /* Export Word needs access to stylesheets that style the content. */
            'https://cdn.ckeditor.com/ckeditor5/45.2.0/ckeditor5.css',
            'https://cdn.ckeditor.com/ckeditor5-premium-features/45.2.0/ckeditor5-premium-features.css'
          ],
          fileName: 'export-word-demo.docx',
          converterOptions: {
            document: {
              orientation: 'portrait',
              size: 'A4',
              margins: {
                top: '20mm',
                bottom: '20mm',
                right: '12mm',
                left: '12mm'
              }
            }
          }
        },
        fontFamily: {
          supportAllValues: true
        },
        fontSize: {
          options: [10, 12, 14, 'default', 18, 20, 22],
          supportAllValues: true
        },
        fullscreen: {
          onEnterCallback: container =>
            container.classList.add(
              'editor-container',
              'editor-container_document-editor',
              'editor-container_include-annotations',
              'editor-container_include-minimap',
              'editor-container_include-pagination',
              'editor-container_include-fullscreen',
              'main-container'
            )
        },
        heading: {
          options: [
            {
              model: 'paragraph',
              title: 'Paragraph',
              class: 'ck-heading_paragraph'
            },
            {
              model: 'heading1',
              view: 'h1',
              title: 'Heading 1',
              class: 'ck-heading_heading1'
            },
            {
              model: 'heading2',
              view: 'h2',
              title: 'Heading 2',
              class: 'ck-heading_heading2'
            },
            {
              model: 'heading3',
              view: 'h3',
              title: 'Heading 3',
              class: 'ck-heading_heading3'
            },
            {
              model: 'heading4',
              view: 'h4',
              title: 'Heading 4',
              class: 'ck-heading_heading4'
            },
            {
              model: 'heading5',
              view: 'h5',
              title: 'Heading 5',
              class: 'ck-heading_heading5'
            },
            {
              model: 'heading6',
              view: 'h6',
              title: 'Heading 6',
              class: 'ck-heading_heading6'
            }
          ]
        },
        image: {
          toolbar: [
            'toggleImageCaption',
            'imageTextAlternative',
            '|',
            'imageStyle:inline',
            'imageStyle:wrapText',
            'imageStyle:breakText',
            '|',
            'resizeImage',
            '|',
            'ckboxImageEdit'
          ]
        },
        initialData: initialData,
        licenseKey: window.FundamentoConfig.ckeditor.licenseKey,
        link: {
          addTargetToExternalLinks: true,
          defaultProtocol: 'https://',
          decorators: {
            toggleDownloadable: {
              mode: 'manual',
              label: 'Downloadable',
              attributes: {
                download: 'file'
              }
            }
          }
        },
        list: {
          properties: {
            styles: true,
            startIndex: true,
            reversed: true
          }
        },
        mention: {
          feeds: [
            {
              marker: '@',
              feed: [
                /* See: https://ckeditor.com/docs/ckeditor5/latest/features/mentions.html */
              ]
            }
          ]
        },
        mergeFields: {
          /* Read more: https://ckeditor.com/docs/ckeditor5/latest/features/merge-fields.html#configuration */
        },
        minimap: {
          container: editorMinimapRef.current,
          extraClasses: 'editor-container_include-minimap ck-minimap__iframe-content'
        },
        pagination: {
          pageWidth: '21cm',
          pageHeight: '29.7cm',
          pageMargins: {
            top: '20mm',
            bottom: '20mm',
            right: '12mm',
            left: '12mm'
          }
        },
        placeholder: 'Type or paste your content here!',
        revisionHistory: {
          editorContainer: editorContainerRef.current,
          viewerContainer: editorRevisionHistoryRef.current,
          viewerEditorElement: editorRevisionHistoryEditorRef.current,
          viewerSidebarContainer: editorRevisionHistorySidebarRef.current,
          resumeUnsavedRevision: true
        },
        sidebar: {
          container: editorAnnotationsRef.current
        },
        table: {
          contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells', 'tableProperties', 'tableCellProperties']
        },
        template: {
          definitions: [
            {
              title: 'Introduction',
              description: 'Simple introduction to an article',
              icon: '<svg width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg">\n    <g id="icons/article-image-right">\n        <rect id="icon-bg" width="45" height="45" rx="2" fill="#A5E7EB"/>\n        <g id="page" filter="url(#filter0_d_1_507)">\n            <path d="M9 41H36V12L28 5H9V41Z" fill="white"/>\n            <path d="M35.25 12.3403V40.25H9.75V5.75H27.7182L35.25 12.3403Z" stroke="#333333" stroke-width="1.5"/>\n        </g>\n        <g id="image">\n            <path id="Rectangle 22" d="M21.5 23C21.5 22.1716 22.1716 21.5 23 21.5H31C31.8284 21.5 32.5 22.1716 32.5 23V29C32.5 29.8284 31.8284 30.5 31 30.5H23C22.1716 30.5 21.5 29.8284 21.5 29V23Z" fill="#B6E3FC" stroke="#333333"/>\n            <path id="Vector 1" d="M24.1184 27.8255C23.9404 27.7499 23.7347 27.7838 23.5904 27.9125L21.6673 29.6268C21.5124 29.7648 21.4589 29.9842 21.5328 30.178C21.6066 30.3719 21.7925 30.5 22 30.5H32C32.2761 30.5 32.5 30.2761 32.5 30V27.7143C32.5 27.5717 32.4391 27.4359 32.3327 27.3411L30.4096 25.6268C30.2125 25.451 29.9127 25.4589 29.7251 25.6448L26.5019 28.8372L24.1184 27.8255Z" fill="#44D500" stroke="#333333" stroke-linejoin="round"/>\n            <circle id="Ellipse 1" cx="26" cy="25" r="1.5" fill="#FFD12D" stroke="#333333"/>\n        </g>\n        <rect id="Rectangle 23" x="13" y="13" width="12" height="2" rx="1" fill="#B4B4B4"/>\n        <rect id="Rectangle 24" x="13" y="17" width="19" height="2" rx="1" fill="#B4B4B4"/>\n        <rect id="Rectangle 25" x="13" y="21" width="6" height="2" rx="1" fill="#B4B4B4"/>\n        <rect id="Rectangle 26" x="13" y="25" width="6" height="2" rx="1" fill="#B4B4B4"/>\n        <rect id="Rectangle 27" x="13" y="29" width="6" height="2" rx="1" fill="#B4B4B4"/>\n        <rect id="Rectangle 28" x="13" y="33" width="16" height="2" rx="1" fill="#B4B4B4"/>\n    </g>\n    <defs>\n        <filter id="filter0_d_1_507" x="9" y="5" width="28" height="37" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">\n            <feFlood flood-opacity="0" result="BackgroundImageFix"/>\n            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>\n            <feOffset dx="1" dy="1"/>\n            <feComposite in2="hardAlpha" operator="out"/>\n            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.29 0"/>\n            <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1_507"/>\n            <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_1_507" result="shape"/>\n        </filter>\n    </defs>\n</svg>\n',
              data: "<h2>Introduction</h2><p>In today's fast-paced world, keeping up with the latest trends and insights is essential for both personal growth and professional development. This article aims to shed light on a topic that resonates with many, providing valuable information and actionable advice. Whether you're seeking to enhance your knowledge, improve your skills, or simply stay informed, our comprehensive analysis offers a deep dive into the subject matter, designed to empower and inspire our readers.</p>"
            }
          ]
        }
      }
    };
  }, [cloud, isLayoutReady]);

  useEffect(() => {
    if (editorConfig) {
      configUpdateAlert(editorConfig);
    }
  }, [editorConfig]);

  return (
    <div className="main-container">
      <div
        className="editor-container editor-container_document-editor editor-container_include-annotations editor-container_include-minimap editor-container_include-pagination editor-container_include-fullscreen"
        ref={editorContainerRef}
      >
        <div className="editor-container__menu-bar" ref={editorMenuBarRef}></div>
        <div className="editor-container__toolbar" ref={editorToolbarRef}></div>
        <div className="editor-container__minimap-wrapper">
          <div className="editor-container__editor-wrapper">
            <div className="editor-container__editor">
              <div ref={editorRef}>
                {DecoupledEditor && editorConfig && (
                  <CKEditor
                    onReady={editor => {
                      editorToolbarRef.current.appendChild(editor.ui.view.toolbar.element);
                      editorMenuBarRef.current.appendChild(editor.ui.view.menuBarView.element);

                      //for getting editor contents when creating new Version
                      window.ckEditor = editor;
                    }}
                    onAfterDestroy={() => {
                      Array.from(editorToolbarRef.current.children).forEach(child => child.remove());
                      Array.from(editorMenuBarRef.current.children).forEach(child => child.remove());
                    }}
                    editor={DecoupledEditor}
                    config={editorConfig}
                    disabled={disabled}
                  />
                )}
              </div>
            </div>
            <div className="editor-container__sidebar" ref={editorAnnotationsRef}></div>
          </div>
          <div className="editor-container__sidebar editor-container__sidebar_minimap" ref={editorMinimapRef}></div>
        </div>
      </div>
      <div className="revision-history" ref={editorRevisionHistoryRef}>
        <div className="revision-history__wrapper">
          <div className="revision-history__editor" ref={editorRevisionHistoryEditorRef}></div>
          <div className="revision-history__sidebar" ref={editorRevisionHistorySidebarRef}></div>
        </div>
      </div>
    </div>
  );
}

/**
 * This function exists to remind you to update the config needed for premium features.
 * The function can be safely removed. Make sure to also remove call to this function when doing so.
 */
function configUpdateAlert(config) {
  if (configUpdateAlert.configUpdateAlertShown) {
    return;
  }

  const isModifiedByUser = (currentValue, forbiddenValue) => {
    if (currentValue === forbiddenValue) {
      return false;
    }

    if (currentValue === undefined) {
      return false;
    }

    return true;
  };

  const valuesToUpdate = [];

  configUpdateAlert.configUpdateAlertShown = true;

  if (!isModifiedByUser(config.licenseKey, '<YOUR_LICENSE_KEY>')) {
    valuesToUpdate.push('LICENSE_KEY');
  }

  if (!isModifiedByUser(config.cloudServices?.tokenUrl, '<YOUR_CLOUD_SERVICES_TOKEN_URL>')) {
    valuesToUpdate.push('CLOUD_SERVICES_TOKEN_URL');
  }

  if (valuesToUpdate.length) {
    console.error(
      [
        'Please update the following values in your editor config',
        'to receive full access to Premium Features:',
        '',
        ...valuesToUpdate.map(value => ` - ${value}`)
      ].join('\n')
    );
  }
}

type HtmlEditorProps = {
  initialData: String,
  document: Document,
  currentUser: User,
  disabled?: boolean,
}

export default HtmlEditor;